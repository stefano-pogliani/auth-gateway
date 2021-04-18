use actix_web::HttpRequest;
use anyhow::Result;

use crate::authenticator::AuthenticationProxy;
use crate::models::AuthenticationResult;
use crate::models::RequestContext;

/// Authenticator that always allows requests for debuging.
pub struct AllowAll {}

#[async_trait::async_trait(?Send)]
impl AuthenticationProxy for AllowAll {
    async fn check(&self, _: &RequestContext, _: &HttpRequest) -> Result<AuthenticationResult> {
        Ok(AuthenticationResult::allowed())
    }
}
