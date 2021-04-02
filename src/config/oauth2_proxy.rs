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
