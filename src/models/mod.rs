use actix_web::http::HeaderMap;

mod context;
mod rule;

pub use context::AuthenticationContext;
pub use context::RequestContext;
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
            authentication_context: AuthenticationContext::unauthenticated(),
            headers: HeaderMap::new(),
            status: AuthenticationStatus::Allowed,
        }
    }

    /// Create an authentication result that denies requests.
    pub fn denied() -> AuthenticationResult {
        AuthenticationResult {
            authentication_context: AuthenticationContext::unauthenticated(),
            headers: HeaderMap::new(),
            status: AuthenticationStatus::Denied,
        }
    }

    /// Create an authentication result that asks ussers to login.
    pub fn must_login() -> AuthenticationResult {
        AuthenticationResult {
            authentication_context: AuthenticationContext::unauthenticated(),
            headers: HeaderMap::new(),
            status: AuthenticationStatus::MustLogin,
        }
    }
}

/// Result of the Authentication proxy decision on the request.
#[derive(Clone, Copy, Debug)]
pub enum AuthenticationStatus {
    /// The request is allowed.
    Allowed,

    /// The request is denied.
    Denied,

    /// The request is denied, a new authentication session may be required.
    MustLogin,
}
