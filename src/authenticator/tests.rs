use actix_web::HttpRequest;
use anyhow::Result;

use crate::authenticator::AuthenticationProxy;
use crate::models::AuthenticationResult;
use crate::models::AuthenticationStatus;
use crate::models::RequestContext;

/// Mock authenticator for tests.
pub struct Authenticator {}

impl AuthenticationProxy for Authenticator {
    fn check(&self, _: &RequestContext, _: &HttpRequest) -> Result<AuthenticationResult> {
        Ok(AuthenticationResult {
            status: AuthenticationStatus::Allowed,
        })
    }
}

impl Default for Authenticator {
    fn default() -> Authenticator {
        Authenticator {}
    }
}
