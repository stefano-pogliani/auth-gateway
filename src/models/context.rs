use std::collections::HashMap;
use std::convert::TryFrom;

use actix_web::HttpRequest;

use crate::errors::InvalidAuthRequest;

/// Rule evaluation context obtained from the authenticator.
#[derive(Clone, Debug)]
pub struct AuthenticationContext {
    /// Result of the authenticator process for the request.
    pub authenticated: bool,

    /// User ID provided by the authenticator, if possible.
    ///
    /// The value a user ID takes depends on the selected authenticator.
    /// For example, this could be an email address.
    pub user: Option<String>,
}

impl AuthenticationContext {
    /// Return an unauthenticated AuthenticationContext.
    pub fn unauthenticated() -> AuthenticationContext {
        AuthenticationContext {
            authenticated: false,
            user: None,
        }
    }
}

/// Rule evaluation context obtained from the request to authenticate.
#[derive(Debug)]
pub struct RequestContext<'request> {
    /// HTTP headers extracted from the auth_request request.
    pub headers: HashMap<&'request str, Vec<&'request str>>,

    /// The host the request is for, as determined by the `Host` header.
    pub host: &'request str,

    /// URI of the request to authenticate.
    pub uri: &'request str,
}

impl<'request> TryFrom<&'request HttpRequest> for RequestContext<'request> {
    type Error = InvalidAuthRequest;

    fn try_from(request: &'request HttpRequest) -> Result<RequestContext<'request>, Self::Error> {
        // Extract required attributes about the request to check.
        let host = request
            .headers()
            .get("Host")
            .ok_or(InvalidAuthRequest::NoHost)?;
        let host =
            std::str::from_utf8(host.as_bytes()).map_err(|_| InvalidAuthRequest::HostNotUtf8)?;
        let uri = request
            .headers()
            .get("X-Original-URI")
            .ok_or(InvalidAuthRequest::NoUri)?;
        let uri =
            std::str::from_utf8(uri.as_bytes()).map_err(|_| InvalidAuthRequest::UriNotUtf8)?;

        // Convert request headers into a HashMap.
        let mut headers: HashMap<&'request str, Vec<&'request str>> = HashMap::new();
        for (name, value) in request.headers() {
            let name = name.as_str();
            let value = std::str::from_utf8(value.as_bytes())
                .map_err(|_| InvalidAuthRequest::HeaderValueNotUtf8(name.to_string()))?;
            headers.entry(name).or_default().push(value);
        }

        // Build a request context for rules evaluation.
        let context = crate::models::RequestContext {
            headers,
            host,
            uri,
        };
        Ok(context)
    }
}

/// Protocol used to request the protcted resource.
#[derive(Clone, Debug)]
pub enum RequestProtocol {
    Http,
    Https,
    Other(String),
}
