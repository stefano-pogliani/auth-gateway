use actix_web::http::StatusCode;
use actix_web::ResponseError;
use thiserror::Error;

/// The authentication request does not meet the auth_request protocol.
#[derive(Error, Debug)]
pub enum InvalidAuthRequest {
    #[error("Required Host header is missing")]
    NoHost,

    #[error("Required X-Original-URI header is missing")]
    NoUri,
}

impl ResponseError for InvalidAuthRequest {
    fn status_code(&self) -> StatusCode {
        StatusCode::BAD_REQUEST
    }
}
