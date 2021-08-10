use actix_web::http::HeaderName;
use anyhow::Context;
use anyhow::Result;

use crate::config::AuthenticatorConfig;

/// Headers to store user identity information from the authenticator.
#[derive(Clone, Debug)]
pub struct IdentityHeaders {
    /// Header to place the user ID in.
    pub user_id: HeaderName,
}

impl IdentityHeaders {
    /// Load the headers to report user identity in from the configuration.
    pub fn from_config(config: &AuthenticatorConfig) -> Result<IdentityHeaders> {
        let user_id = HeaderName::from_bytes(config.user_id_header.as_bytes())
            .with_context(|| "user ID identity reporting is not valid")?;
        Ok(IdentityHeaders { user_id })
    }
}

impl Default for IdentityHeaders {
    fn default() -> IdentityHeaders {
        IdentityHeaders {
            user_id: HeaderName::from_static("x-auth-request-user"),
        }
    }
}
