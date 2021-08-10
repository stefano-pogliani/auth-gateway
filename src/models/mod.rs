use actix_web::http::HeaderMap;
use serde::Deserialize;
use serde::Serialize;

mod audit;
mod context;
mod rule;

pub use audit::AuditReason;
pub use audit::AuditRecord;
pub use audit::AuditRecordBuilder;
pub use context::AuthenticationContext;
pub use context::RequestContext;
pub use context::RequestProtocol;
pub use rule::EnrichResponseRule;
pub use rule::PostAuthRule;
pub use rule::PreAuthRule;
pub use rule::Rule;
pub use rule::RuleAction;
pub use rule::RuleMatches;
pub use rule::RuleSessionMatches;

/// Final outcome from the authentication process.
#[derive(Clone, Debug)]
pub struct AuthenticationResult {
    /// Reason for the authentication result for the audit record.
    pub audit_reason: AuditReason,

    /// Authentication context to match post-auth rules and to build authentication responses.
    pub authentication_context: AuthenticationContext,

    /// Set of headers from the authenticator to propagate back to the HTTP proxy.
    pub headers: HeaderMap,

    /// Result of the Authentication proxy decision on the request.
    pub status: AuthenticationStatus,
}

impl AuthenticationResult {
    /// Create an authentication result that allows requests.
    pub fn allowed() -> AuthenticationResult {
        AuthenticationResult {
            audit_reason: AuditReason::Allowed,
            authentication_context: AuthenticationContext::unauthenticated(),
            headers: HeaderMap::new(),
            status: AuthenticationStatus::Allowed,
        }
    }

    /// Create an authentication result that denies requests.
    pub fn denied() -> AuthenticationResult {
        AuthenticationResult {
            audit_reason: AuditReason::Denied,
            authentication_context: AuthenticationContext::unauthenticated(),
            headers: HeaderMap::new(),
            status: AuthenticationStatus::Denied,
        }
    }

    /// Create an authentication result from an AuthenticationStatus.
    pub fn from_status(status: AuthenticationStatus) -> AuthenticationResult {
        let audit_reason = match status {
            AuthenticationStatus::Allowed => AuditReason::Allowed,
            AuthenticationStatus::Denied => AuditReason::Denied,
            AuthenticationStatus::MustLogin => AuditReason::InvalidSession,
        };
        AuthenticationResult {
            audit_reason,
            authentication_context: AuthenticationContext::unauthenticated(),
            headers: HeaderMap::new(),
            status,
        }
    }
}

/// Result of the Authentication proxy decision on the request.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum AuthenticationStatus {
    /// The request is allowed.
    #[serde(rename = "allowed")]
    Allowed,

    /// The request is denied.
    #[serde(rename = "denied")]
    Denied,

    /// The request is denied, a new authentication session may be required.
    #[serde(rename = "must-login")]
    MustLogin,
}

impl AuthenticationStatus {
    /// Check if the AuthenticationStatus is allowed.
    pub fn authenticated(&self) -> bool {
        matches!(self, AuthenticationStatus::Allowed)
    }
}
