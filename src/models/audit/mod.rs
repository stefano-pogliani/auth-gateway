use std::time::Duration;
use std::time::Instant;

use chrono::DateTime;
use chrono::Utc;
use serde::Deserialize;
use serde::Serialize;

use super::AuthenticationResult;
use super::AuthenticationStatus;
use super::RequestContext;
use super::RequestProtocol;

#[cfg(test)]
mod tests;

/// Reason for the authentication response provided for a request.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum AuditReason {
    /// The request was allowed by the authentication proxy.
    #[serde(rename = "allowed")]
    Allowed,

    /// The request was denied by the authentication proxy or by a rule.
    #[serde(rename = "denied")]
    Denied,

    /// The request was denied by the authentication proxy requesting a new session.
    #[serde(rename = "invalid-session")]
    InvalidSession,

    /// The request was allowed by a post-auth phase rule.
    #[serde(rename = "post-auth-allowed")]
    PostAuthAllowed,

    /// The request was denied by a post-auth phase rule.
    #[serde(rename = "post-auth-denied")]
    PostAuthDenied,

    /// The request was allowed by a pre-auth phase rule.
    #[serde(rename = "pre-auth-allowed")]
    PreAuthAllowed,

    /// The request was denied by a pre-auth phase rule.
    #[serde(rename = "pre-auth-denied")]
    PreAuthDenied,
}

/// Record of information about an authorisation request for auditing.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AuditRecord {
    /// The request was ultimatelly allowed.
    pub authenticated: bool,

    /// Duration of the authentication request processing.
    pub duration: Duration,

    /// Protocol the original request was sent over.
    pub protocol: RequestProtocol,

    /// Reason for the authentication response.
    pub reason: AuditReason,

    /// Full URL looking for authentication.
    pub resource: String,

    /// Exact authentication status returned to the client.
    pub result: AuthenticationStatus,

    /// ID of the session attached to the request, if available.
    pub session_id: Option<String>,

    /// Timestamp the request was received by the AuthGateway proxy.
    pub timestamp: DateTime<Utc>,

    /// ID of the user attached to the request, if available.
    pub user_id: Option<String>,
}

/// Collect request and processing information to build an AuditRecord.
#[derive(Debug)]
pub struct AuditRecordBuilder {
    protocol: RequestProtocol,
    resource: String,
    std_start: Instant,
    timestamp: DateTime<Utc>,
}

impl AuditRecordBuilder {
    /// Build an immutable audit record for the request.
    pub fn finish(self, result: &AuthenticationResult) -> AuditRecord {
        AuditRecord {
            authenticated: result.status.authenticated(),
            duration: self.std_start.elapsed(),
            protocol: self.protocol,
            reason: result.audit_reason,
            resource: self.resource,
            result: result.status,
            session_id: result.authentication_context.session.clone(),
            timestamp: self.timestamp,
            user_id: result.authentication_context.user.clone(),
        }
    }

    /// Start building an AuditRecord for a new authentication request.
    pub fn start(context: &RequestContext) -> AuditRecordBuilder {
        let protocol = context.protocol.clone();
        let resource = format!("{0}://{1}{2}", protocol, context.host, context.uri);
        AuditRecordBuilder {
            protocol,
            resource,
            std_start: Instant::now(),
            timestamp: Utc::now(),
        }
    }
}
