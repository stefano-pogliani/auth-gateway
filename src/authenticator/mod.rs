use actix_web::HttpRequest;
use anyhow::Result;
use serde::Deserialize;
use serde::Serialize;

use crate::engine::RulesEngine;
use crate::models::AuthenticationResult;
use crate::models::RequestContext;
use crate::models::RuleAction;

mod allow_all;

#[cfg(test)]
pub mod tests;

/// Wrap logic around authentication proxy and rules engine.
pub struct Authenticator {
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
        let rules = RulesEngine::builder().build().unwrap();
        let proxy = Box::new(authenticator);
        Authenticator { proxy, rules }
    }

    /// Instantiate the configured authentication proxy .
    pub fn from_config(rules: RulesEngine, config: &AuthenticatorConfig) -> Authenticator {
        let proxy = match config {
            AuthenticatorConfig::AllowAll => Box::new(self::allow_all::AllowAll {}),
        };
        Authenticator { proxy, rules }
    }
}

impl Authenticator {
    /// Check a request for valid authentication.
    pub fn check(
        &self,
        context: &RequestContext,
        request: &HttpRequest,
    ) -> Result<AuthenticationResult> {
        match self.rules.eval_preauth(context) {
            RuleAction::Allow => {
                let result = AuthenticationResult::allowed();
                // TODO: enrich resposnse using an empty AuthenticationContext.
                return Ok(result);
            }
            RuleAction::Delegate => (),
            RuleAction::Deny => return Ok(AuthenticationResult::denied()),
        };
        self.proxy.check(context, request)
        // TODO: check post-auth rules.
        // TODO: enrich response.
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

/// Supported authenticators and their configuration options.
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(tag = "backend")]
pub enum AuthenticatorConfig {
    /// Debug authenticator to allow all requests.
    #[cfg(debug_assertions)]
    #[serde(rename = "allow-all")]
    AllowAll,
}
