use std::collections::HashMap;

use actix_web::HttpRequest;
use serde::Deserialize;
use serde::Serialize;

use crate::config::RequestExtraction;
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

    /// Session ID provided by the authenticator, if possible.
    ///
    /// The value of the session ID depends on the selected authenticator.
    /// AuthGateway treats this as an opaque string value.
    pub session: Option<String>,
}

impl AuthenticationContext {
    /// Return an unauthenticated AuthenticationContext.
    pub fn unauthenticated() -> AuthenticationContext {
        AuthenticationContext {
            authenticated: false,
            user: None,
            session: None,
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

    /// Protocol of the request to authenticate.
    pub protocol: RequestProtocol,

    /// URI of the request to authenticate.
    pub uri: &'request str,
}

impl<'request> RequestContext<'request> {
    // Extract the RequestContext for the request to authenticate.
    pub fn from_request(
        request: &'request HttpRequest,
        extraction: &RequestExtraction,
    ) -> Result<RequestContext<'request>, InvalidAuthRequest> {
        // Extract required attributes about the request to check.
        let host = request
            .headers()
            .get(&extraction.host)
            .ok_or(InvalidAuthRequest::NoHost)?;
        let host =
            std::str::from_utf8(host.as_bytes()).map_err(|_| InvalidAuthRequest::HostNotUtf8)?;
        let protocol = request
            .headers()
            .get(&extraction.protocol)
            .ok_or(InvalidAuthRequest::NoProtocol)?;
        let protocol = std::str::from_utf8(protocol.as_bytes())
            .map_err(|_| InvalidAuthRequest::ProtocolNotUtf8)?
            .to_lowercase();
        let protocol = match protocol.as_str() {
            "http" => RequestProtocol::Http,
            "https" => RequestProtocol::Https,
            _ => RequestProtocol::Other(protocol),
        };
        let uri = request
            .headers()
            .get(&extraction.uri)
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
            protocol,
            uri,
        };
        Ok(context)
    }
}

/// Protocol used to request the protcted resource.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum RequestProtocol {
    #[serde(rename = "http")]
    Http,

    #[serde(rename = "https")]
    Https,

    #[serde(rename = "other")]
    Other(String),
}

impl std::fmt::Display for RequestProtocol {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RequestProtocol::Http => write!(f, "http"),
            RequestProtocol::Https => write!(f, "https"),
            RequestProtocol::Other(proto) => proto.fmt(f),
        }
    }
}
