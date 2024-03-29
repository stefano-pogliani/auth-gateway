use serde::Deserialize;
use serde::Serialize;

/// OAuth2Proxy backend configuration.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct OAuth2ProxyConfig {
    /// Address to reach the OAuth2Proxy server.
    #[serde(default = "OAuth2ProxyConfig::default_address")]
    pub address: String,

    /// Domain the oauth2_proxy UI is on.
    ///
    /// Used to allow requests so users can sign in.
    #[serde(default, rename = "auth-domain")]
    pub auth_domain: Option<String>,

    /// URI prefix where the oauth2_proxy UI is on.
    ///
    /// Used to allow requests so users can sign in.
    #[serde(
        default = "OAuth2ProxyConfig::default_proxy_prefix",
        rename = "proxy-prefix"
    )]
    pub prefix: String,

    /// Timeout (in seconds) to wait for OAuth2Proxy to respond.
    ///
    /// By default this is an aggressive timeout as it applies to every request that is checked
    /// and most OAuth2Proxy responses at this stage should just check cookies or tokens.
    #[serde(
        default = "OAuth2ProxyConfig::default_timeout_sec",
        rename = "timeout-sec"
    )]
    pub timeout_sec: u64,

    /// Header in Oauth2Proxy responses to fetch user IDs from.
    #[serde(default, rename = "user-id-source-header")]
    pub user_id_source_header: OAuth2ProxyUserIdSourceHeader,
}

impl OAuth2ProxyConfig {
    fn default_address() -> String {
        "http://127.0.0.1:4180".into()
    }

    fn default_proxy_prefix() -> String {
        "/oauth2".into()
    }

    fn default_timeout_sec() -> u64 {
        5
    }
}

/// Header in Oauth2Proxy responses to fetch user IDs from.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum OAuth2ProxyUserIdSourceHeader {
    /// Use the user email from X-Auth-Request-Email.
    #[serde(rename = "email")]
    Email,

    /// Use the user id from X-Auth-Request-User.
    #[serde(rename = "user")]
    User,
}

impl Default for OAuth2ProxyUserIdSourceHeader {
    fn default() -> OAuth2ProxyUserIdSourceHeader {
        OAuth2ProxyUserIdSourceHeader::User
    }
}
