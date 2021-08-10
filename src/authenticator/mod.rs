use std::sync::Arc;

use actix_web::HttpRequest;
use anyhow::Result;

use crate::config::AuthenticatorBackend;
use crate::config::Config;
use crate::engine::RulesEngine;
use crate::models::AuditReason;
use crate::models::AuthenticationResult;
use crate::models::AuthenticationStatus;
use crate::models::RequestContext;
use crate::models::RuleAction;

mod allow_all;
mod identity_headers;
mod oauth2_proxy;

#[cfg(test)]
pub mod tests;

use self::identity_headers::IdentityHeaders;

/// Interface to authentication implementations.
#[async_trait::async_trait(?Send)]
pub trait AuthenticationProxy {
    /// Check if the request is authenticated context.
    async fn check(
        &self,
        context: &RequestContext,
        request: &HttpRequest,
    ) -> Result<AuthenticationResult>;
}

/// Thread-safe logic to create thread-scoped `AuthenticationProxy` instances.
///
/// Used by `AuthenticatorFactory` instances to create authentication proxy
/// while reusing as much logic as possible.
pub trait AuthenticationProxyFactory: Send + Sync {
    /// Return a new `AuthenticationProxy` instance.
    fn make(&self) -> Box<dyn AuthenticationProxy>;
}

/// Wrap logic around authentication proxy and rules engine.
pub struct Authenticator {
    /// Headers to inject user identity information into.
    pub headers: IdentityHeaders,

    /// The Authenticator proxy to check requests with.
    proxy: Box<dyn AuthenticationProxy>,

    /// Rules engine to customise and enrich the authentication process.
    rules: RulesEngine,
}

impl Authenticator {
    /// Create an AuthenticatorFactory from configuration options.
    pub fn factory(config: &Config) -> Result<AuthenticatorFactory> {
        let factory: Arc<dyn AuthenticationProxyFactory> = match config.authenticator.backend {
            AuthenticatorBackend::AllowAll => Arc::new(self::allow_all::AllowAll {}),
            AuthenticatorBackend::OAuth2Proxy(ref oauth2_proxy) => Arc::new(
                self::oauth2_proxy::OAuth2ProxyFactory::from_config(oauth2_proxy),
            ),
        };
        let headers = IdentityHeaders::from_config(&config.authenticator)?;
        let rules = RulesEngine::builder()
            .rule_files(&config.rule_files)
            .build()?;
        Ok(AuthenticatorFactory {
            factory,
            headers,
            rules,
        })
    }

    /// Instantiate an authenticator from the given authentication proxy.
    #[cfg(test)]
    pub fn from<A>(authenticator: A) -> Authenticator
    where
        A: AuthenticationProxy + 'static,
    {
        let headers = IdentityHeaders::default();
        let rules = RulesEngine::builder().build().unwrap();
        let proxy = Box::new(authenticator);
        Authenticator {
            headers,
            proxy,
            rules,
        }
    }

    /// Check a request for valid authentication.
    pub async fn check(
        &self,
        context: &RequestContext<'_>,
        request: &HttpRequest,
    ) -> Result<AuthenticationResult> {
        // Process pre-authentication rules and exit early if possible.
        match self.rules.eval_preauth(context) {
            RuleAction::Allow => {
                let mut result = AuthenticationResult::allowed();
                result.audit_reason = AuditReason::PreAuthAllowed;
                return self.rules.eval_enrich(context, result);
            }
            RuleAction::Delegate => (),
            RuleAction::Deny => {
                let mut result = AuthenticationResult::denied();
                result.audit_reason = AuditReason::PreAuthDenied;
                return Ok(result);
            }
        };

        // Authenticate against the AuthProxy, directing users to login if needed.
        let mut result = self.proxy.check(context, request).await?;
        if let AuthenticationStatus::MustLogin = result.status {
            return Ok(result);
        }

        // Process post-authentication rules.
        let postauth = self
            .rules
            .eval_postauth(context, &result.authentication_context);
        match postauth {
            RuleAction::Allow => {
                result.audit_reason = AuditReason::PostAuthAllowed;
                result.status = AuthenticationStatus::Allowed;
            }
            RuleAction::Delegate => (),
            RuleAction::Deny => {
                result.audit_reason = AuditReason::PostAuthDenied;
                result.status = AuthenticationStatus::Denied;
            }
        };

        // Process enrich rules for allowed responses.
        self.rules.eval_enrich(context, result)
    }
}

/// Thread-safe logic to create thread-scoped `Authenticator` instances.
///
/// This allows implementations to initiate and share global state once for the entire process
/// while also allowing the use of thread-scoped objects where needed.
#[derive(Clone)]
pub struct AuthenticatorFactory {
    factory: Arc<dyn AuthenticationProxyFactory>,
    headers: IdentityHeaders,
    rules: RulesEngine,
}

impl AuthenticatorFactory {
    /// Return a new `Authenticator` instance.
    pub fn make(&self) -> Authenticator {
        Authenticator {
            headers: self.headers.clone(),
            proxy: self.factory.make(),
            rules: self.rules.clone(),
        }
    }
}
