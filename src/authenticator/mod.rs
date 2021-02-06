use actix_web::HttpRequest;
use anyhow::Result;
use serde::Deserialize;
use serde::Serialize;

use crate::models::AuthenticationResult;
use crate::models::RequestContext;

mod allow_all;

#[cfg(test)]
pub mod tests;

/// Wrap logic around authentication proxy and rules engine.
pub struct Authenticator(Box<dyn AuthenticationProxy>);

impl Authenticator {
    /// Instantiate an authenticator from the given authentication proxy.
    #[cfg(test)]
    pub fn from<A>(authenticator: A) -> Authenticator
    where
        A: AuthenticationProxy + 'static,
    {
        Authenticator(Box::new(authenticator))
    }

    /// Instantiate the configured authentication proxy .
    pub fn from_config(config: &AuthenticatorConfig) -> Authenticator {
        let proxy = match config {
            AuthenticatorConfig::AllowAll => Box::new(self::allow_all::AllowAll {}),
        };
        Authenticator(proxy)
    }
}

impl Authenticator {
    /// Check a request for valid authentication.
    pub fn check(
        &self,
        context: &RequestContext,
        request: &HttpRequest,
    ) -> Result<AuthenticationResult> {
        self.0.check(context, request)
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
