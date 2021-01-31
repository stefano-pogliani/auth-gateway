use std::collections::HashMap;

/// Rule evaluation context obtained from the authenticator.
pub struct AuthenticationContext {
    /// Result of the authenticator process for the request.
    pub authenticated: bool,

    /// User ID provided by the authenticator, if possible.
    ///
    /// The value a user ID takes depends on the selected authenticator.
    /// For example, this could be an email address.
    pub user: Option<String>,
}

/// Rule evaluation context obtained from the request to authenticate.
#[derive(Debug)]
pub struct RequestContext {
    /// The domain, as determined by the `Host` header.
    pub domain: String,

    /// HTTP headers extracted from the auth_request request.
    pub headers: HashMap<String, String>,

    /// URI of the request to authenticate.
    pub uri: String,
}
