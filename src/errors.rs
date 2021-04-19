use actix_web::http::StatusCode;
use actix_web::web::HttpResponse;
use actix_web::ResponseError;
use thiserror::Error;

/// Error sending the audit record for a request.
#[derive(Error, Debug)]
#[error("Error sending the audit record for a request")]
pub struct AuditSendError {
    #[from]
    source: anyhow::Error,
}

impl ResponseError for AuditSendError {
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
    #[error("Value for header '{}' is not UTF8 encoded", _0)]
    HeaderValueNotUtf8(String),

    #[error("Host header is not UTF8 encoded")]
    HostNotUtf8,

    #[error("Required Host header is missing")]
    NoHost,

    #[error("Required X-Forwarded-Proto header is missing")]
    NoProtocol,

    #[error("Required X-Original-URI header is missing")]
    NoUri,

    #[error("X-Forwarded-Proto header is not UTF8 encoded")]
    ProtocolNotUtf8,

    #[error("X-Original-URI header is not UTF8 encoded")]
    UriNotUtf8,
}

impl ResponseError for InvalidAuthRequest {
    fn status_code(&self) -> StatusCode {
        StatusCode::BAD_REQUEST
    }
}

/// Error enriching the Authentication response.
#[derive(Error, Debug)]
#[error("Error enriching the Authentication response")]
pub struct InvalidEnrichResponseRule {
    #[from]
    source: anyhow::Error,
}
