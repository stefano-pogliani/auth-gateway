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
#[derive(Debug)]
pub struct AuthenticationResult {
    /// Set of headers from the authenticator to propagate back to the HTTP proxy.
    //pub headers: bool,

    /// Result of the Authentication proxy decision on the request.
    pub status: AuthenticationStatus,
}

/// Result of the Authentication proxy decision on the request.
#[derive(Debug)]
pub enum AuthenticationStatus {
    /// The request is allowed.
    Allowed,

    /// The request is denied.
    Denied,

    /// The request is denied, a new authentication session may be required.
    MustLogin,
}
