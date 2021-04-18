use std::time::Duration;

use actix_web::client::Client;
use actix_web::http::HeaderMap;
use actix_web::HttpRequest;
use anyhow::Result;
use sha3::Digest;
use sha3::Sha3_512 as Sha512;

use crate::authenticator::AuthenticationProxy;
use crate::config::OAuth2ProxyConfig;
use crate::models::AuthenticationResult;
use crate::models::AuthenticationStatus;
use crate::models::RequestContext;

const USER_ID_HEADER: &str = "x-auth-request-user";
const SESSION_ID_HEADER: &str = "x-auth-request-access-token";

/// Attempt to extract the user ID from response headers.
fn extract_user(headers: &HeaderMap) -> Option<String> {
    match headers.get(USER_ID_HEADER) {
        None => None,
        Some(user) => match String::from_utf8(user.as_bytes().to_vec()) {
            Ok(user) => Some(user),
            Err(error) => {
                log::error!("Unable to UTF8 decode user ID {:?}", error);
                None
            }
        },
    }
}

/// Attempt to extract the session ID from response headers.
fn extract_session(headers: &HeaderMap) -> Option<String> {
    let session = match headers.get(SESSION_ID_HEADER) {
        None => None,
        Some(session) => match String::from_utf8(session.as_bytes().to_vec()) {
            Ok(session) => Some(session),
            Err(error) => {
                log::error!("Unable to UTF8 decode session ID {:?}", error);
                None
            }
        },
    };

    // One-way encrypt the Authentication token to derive a session ID.
    session.map(|session| {
        let session = Sha512::digest(session.as_bytes());
        format!("{:X}", session)
    })
}

/// Authenticate users with [oauth2_proxy](https://oauth2-proxy.github.io/oauth2-proxy/).
pub struct OAuth2Proxy {
    client: Client,
    config: OAuth2ProxyConfig,
}

impl OAuth2Proxy {
    /// Return an OAuth2Proxy backend from the configuration.
    pub fn from_config(config: &OAuth2ProxyConfig) -> OAuth2Proxy {
        let mut config = config.clone();
        if config.address.ends_with('/') {
            config.address = config.address.trim_end_matches('/').to_string();
        }
        if !config.prefix.starts_with('/') {
            config.prefix = format!("/{}", config.prefix);
        }
        if !config.prefix.ends_with('/') {
            config.prefix = format!("{}/", config.prefix);
        }
        let client = Client::builder()
            .disable_redirects()
            .timeout(Duration::from_secs(config.timeout_sec))
            .finish();
        OAuth2Proxy { client, config }
    }
}

#[async_trait::async_trait(?Send)]
impl AuthenticationProxy for OAuth2Proxy {
    async fn check(
        &self,
        context: &RequestContext,
        request: &HttpRequest,
    ) -> Result<AuthenticationResult> {
        // Check the requested URL starts with the expected prefix.
        // If an auth domain is set it also has to match the request.
        let mut auth_ui = context.uri.starts_with(&self.config.prefix);
        if let Some(domain) = &self.config.auth_domain {
            auth_ui = auth_ui && (context.host == domain);
        }
        if auth_ui {
            return Ok(AuthenticationResult::allowed());
        }

        // Proxy request up to OAuth2Proxy.
        // Any errors interacting with OAuth2Proxy is logged and user requests are denied.
        let url = format!("{}{}auth", self.config.address, self.config.prefix);
        let response = self.client.request_from(url, request.head()).send().await;
        let response = match response {
            Ok(response) => response,
            Err(error) => {
                log::error!("Unable to check request with OAuth2Proxy: {:?}", error);
                return Ok(AuthenticationResult::denied());
            }
        };

        // Validate response for HTTP-level errors (500, 404, etc ...).
        let status = match response.status().as_u16() {
            202 => AuthenticationStatus::Allowed,
            401 => AuthenticationStatus::MustLogin,
            _ => {
                let mut response = response;
                let body = response.body().await;
                log::error!(
                    "Unexpected status code from OAuth2Proxy: {}",
                    response.status()
                );
                log::debug!("Response body for unexpected status code: {:?}", body);
                return Ok(AuthenticationResult::denied());
            }
        };

        // Extract user information from oauth2_proxy response.
        let headers = response.headers();
        let user = extract_user(headers);
        let session = extract_session(headers);

        // Return generated authentication result and context.
        let mut result = AuthenticationResult::from_status(status);
        result.authentication_context.authenticated = status.authenticated();
        result.authentication_context.user = user;
        result.authentication_context.session = session;
        Ok(result)
    }
}
