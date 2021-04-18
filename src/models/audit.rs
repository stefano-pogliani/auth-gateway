use std::time::Duration;

use super::AuthenticationStatus;
use super::RequestProtocol;

/// Record of information about an authorisation request for auditing.
#[derive(Clone, Debug)]
pub struct AuditRecord {
    pub authenticated: bool,
    pub duration: Duration,
    pub protocol: RequestProtocol,
    pub reason: AuditReason,
    pub resource: String,
    pub result: AuthenticationStatus,
    pub session_id: String,
    //pub timestamp: TODO,
    pub user_id: Option<String>,
}

/// Collect request and processing information to build an AuditRecord.
pub struct AuditRecordBuilder {
    // TODO
}

/// Reason for the authentication response provided for a request.
#[derive(Clone, Debug)]
pub enum AuditReason {
    /// The request was allowed by the authentication proxy.
    Authenticated,

    /// The request was denied by the authentication proxy or by a rule.
    Denied,

    /// The request was denied by the authentication proxy requesting a new session.
    InvalidSession,

    /// The request was allowed by a post-auth phase rule.
    PostAuthAllowed,

    /// The request was allowed by a pre-auth phase rule.
    PreAuthAllowed,
}
