use std::time::Duration;

use actix_web::http::header::HeaderMap;
use actix_web::HttpRequest;
use anyhow::Result;
use awc::Client;
use sha3::Digest;
use sha3::Sha3_512 as Sha512;

use crate::authenticator::AuthenticationProxy;
use crate::authenticator::AuthenticationProxyFactory;
use crate::config::OAuth2ProxyConfig;
use crate::config::OAuth2ProxyUserIdSourceHeader;
use crate::models::AuditReason;
use crate::models::AuthenticationResult;
use crate::models::AuthenticationStatus;
use crate::models::RequestContext;

const ACCESSS_TOKEN_HEADER: &str = "x-auth-request-access-token";
const USER_EMAIL_HEADER: &str = "x-auth-request-email";
const USER_ID_HEADER: &str = "x-auth-request-user";

/// Attempt to extract the named header from response headers.
fn extract_header(headers: &HeaderMap, header: &str) -> Option<String> {
    match headers.get(header) {
        None => None,
        Some(value) => match String::from_utf8(value.as_bytes().to_vec()) {
            Ok(value) => Some(value),
            Err(error) => {
                log::error!("Unable to UTF8 decode header `{}`: {:?}", header, error);
                None
            }
        },
    }
}

/// Attempt to extract the user email from response headers.
fn extract_email(headers: &HeaderMap) -> Option<String> {
    extract_header(headers, USER_EMAIL_HEADER)
}

/// Attempt to extract the user ID from response headers.
fn extract_user(headers: &HeaderMap) -> Option<String> {
    extract_header(headers, USER_ID_HEADER)
}

/// Attempt to extract the session ID from response headers.
fn extract_session(headers: &HeaderMap) -> Option<String> {
    let session = extract_header(headers, ACCESSS_TOKEN_HEADER);

    // TODO: Corrupt the access token so even if it is reverted it becomes unusable.
    // This "corruption" must:
    // - Preserve token uniqueness so sessions don't get mixed up.
    // - Consistently "corrupt" tokens so one token never becomes two.

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
            let mut result = AuthenticationResult::allowed();
            result.audit_reason = AuditReason::PreAuthAllowed;
            return Ok(result);
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
        let user = match self.config.user_id_source_header {
            OAuth2ProxyUserIdSourceHeader::Email => extract_email(headers),
            OAuth2ProxyUserIdSourceHeader::User => extract_user(headers),
        };
        let session = extract_session(headers);

        // Return generated authentication result and context.
        let mut result = AuthenticationResult::from_status(status);
        result.authentication_context.authenticated = status.authenticated();
        result.authentication_context.user = user;
        result.authentication_context.session = session;
        Ok(result)
    }
}

/// Instantiate per-thread `OAuth2Proxy` instances.
pub struct OAuth2ProxyFactory {
    config: OAuth2ProxyConfig,
}

impl OAuth2ProxyFactory {
    pub fn from_config(config: &OAuth2ProxyConfig) -> OAuth2ProxyFactory {
        let config = config.clone();
        OAuth2ProxyFactory { config }
    }
}

impl AuthenticationProxyFactory for OAuth2ProxyFactory {
    fn make(&self) -> Box<dyn AuthenticationProxy> {
        Box::new(OAuth2Proxy::from_config(&self.config))
    }
}
