use actix_web::http::StatusCode;
use actix_web::web::HttpResponse;
use actix_web::ResponseError;
use thiserror::Error;

/// Error checking authentication for a request.
#[derive(Error, Debug)]
#[error("Error checking authentication for a request")]
pub struct AuthenticationCheckError {
    #[from]
    source: anyhow::Error,
}

impl ResponseError for AuthenticationCheckError {
    fn error_response(&self) -> HttpResponse {
        // Create a JSON response and encode it.
        let json = serde_json::json!({
            "error": true,
            "message": self.to_string(),
        });
        let body = match serde_json::to_string_pretty(&json) {
            Ok(body) => body,
            Err(err) => format!("<error serialization failed: {}>", err),
        };

        // Send the encoded response to client.
        HttpResponse::build(self.status_code())
            .content_type("application/json")
            .body(body)
    }
}

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
