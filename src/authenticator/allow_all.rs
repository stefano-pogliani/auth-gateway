use actix_web::HttpRequest;
use anyhow::Result;

use crate::authenticator::AuthenticationProxy;
use crate::models::AuthenticationContext;
use crate::models::AuthenticationResult;
use crate::models::AuthenticationStatus;
use crate::models::RequestContext;

/// Authenticator that always allows requests for debuging.
pub struct AllowAll {}

#[async_trait::async_trait(?Send)]
impl AuthenticationProxy for AllowAll {
    async fn check(&self, _: &RequestContext, _: &HttpRequest) -> Result<AuthenticationResult> {
        Ok(AuthenticationResult {
            authentication_context: AuthenticationContext::unauthenticated(),
            headers: actix_web::http::HeaderMap::new(),
            status: AuthenticationStatus::Allowed,
        })
    }
}
