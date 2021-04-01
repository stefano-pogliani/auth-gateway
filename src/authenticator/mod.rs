use actix_web::http::HeaderName;
use actix_web::HttpRequest;
use anyhow::Context;
use anyhow::Result;

use crate::config::AuthenticatorBackend;
use crate::config::AuthenticatorConfig;
use crate::engine::RulesEngine;
use crate::models::AuthenticationResult;
use crate::models::AuthenticationStatus;
use crate::models::RequestContext;
use crate::models::RuleAction;

mod allow_all;

#[cfg(test)]
pub mod tests;

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

    /// Instantiate the configured authentication proxy .
    pub fn from_config(
        headers: IdentityHeaders,
        rules: RulesEngine,
        config: &AuthenticatorConfig,
    ) -> Authenticator {
        let proxy = match config.backend {
            AuthenticatorBackend::AllowAll => Box::new(self::allow_all::AllowAll {}),
        };
        Authenticator {
            headers,
            proxy,
            rules,
        }
    }
}

impl Authenticator {
    /// Check a request for valid authentication.
    pub fn check(
        &self,
        context: &RequestContext,
        request: &HttpRequest,
    ) -> Result<AuthenticationResult> {
        // Process pre-authentication rules and exit early if possible.
        match self.rules.eval_preauth(context) {
            RuleAction::Allow => {
                let result = AuthenticationResult::allowed();
                return self.rules.eval_enrich(context, result);
            }
            RuleAction::Delegate => (),
            RuleAction::Deny => return Ok(AuthenticationResult::denied()),
        };

        // Authenticate against the AuthProxy, directing users to login if needed.
        let mut result = self.proxy.check(context, request)?;
        if let AuthenticationStatus::MustLogin = result.status {
            return Ok(result);
        }

        // Process post-authentication rules.
        let postauth = self
            .rules
            .eval_postauth(context, &result.authentication_context);
        match postauth {
            RuleAction::Allow => result.status = AuthenticationStatus::Allowed,
            RuleAction::Delegate => (),
            RuleAction::Deny => result.status = AuthenticationStatus::Denied,
        };

        // Process enrich rules for allowed responses.
        self.rules.eval_enrich(context, result)
    }
}

/// Interface to authentication implementations.
pub trait AuthenticationProxy {
    /// Check if the request is authenticated context.
    fn check(
        &self,
        context: &RequestContext,
        request: &HttpRequest,
    ) -> Result<AuthenticationResult>;
}

/// Headers to store user identity information from the authenticator.
#[derive(Clone, Debug)]
pub struct IdentityHeaders {
    /// Header to place the user ID in.
    pub user_id: HeaderName,
}

impl IdentityHeaders {
    /// Load the headers to report user identity in from the configuration.
    pub fn from_config(config: &AuthenticatorConfig) -> Result<IdentityHeaders> {
        let user_id = HeaderName::from_bytes(config.user_id_header.as_bytes())
            .with_context(|| "user ID identity reporting is not valid")?;
        Ok(IdentityHeaders { user_id })
    }
}

impl Default for IdentityHeaders {
    fn default() -> IdentityHeaders {
        IdentityHeaders {
            user_id: HeaderName::from_static("x-auth-request-user"),
        }
    }
}
