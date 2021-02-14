use actix_web::HttpRequest;
use anyhow::Result;

use crate::authenticator::AuthenticationProxy;
use crate::models::AuthenticationResult;
use crate::models::AuthenticationStatus;
use crate::models::RequestContext;

/// Authenticator that always allows requests for debuging.
pub struct AllowAll {}

impl AuthenticationProxy for AllowAll {
    fn check(&self, _: &RequestContext, _: &HttpRequest) -> Result<AuthenticationResult> {
        Ok(AuthenticationResult {
            headers: actix_web::http::HeaderMap::new(),
            status: AuthenticationStatus::Allowed,
        })
    }
}
