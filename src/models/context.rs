use actix_web::http::HeaderMap;
use actix_web::http::HeaderValue;

/// Rule evaluation context obtained from the authenticator.
#[derive(Debug)]
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
pub struct RequestContext<'request> {
    /// The domain, as determined by the `Host` header.
    pub domain: &'request HeaderValue,

    /// HTTP headers extracted from the auth_request request.
    pub headers: &'request HeaderMap,

    /// URI of the request to authenticate.
    pub uri: &'request HeaderValue,
}
