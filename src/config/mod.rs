use std::fs::File;
use std::path::Path;

use anyhow::Context;
use anyhow::Result;
use serde::Deserialize;
use serde::Serialize;

mod oauth2_proxy;

pub use self::oauth2_proxy::OAuth2ProxyConfig;

/// Supported audit record backends and their configuration options.
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(tag = "backend")]
pub enum AuditBackend {
    /// Emit audit records as log events.
    #[serde(rename = "log")]
    Log,

    /// Drop all audit records.
    #[serde(rename = "noop")]
    Noop,
}

impl Default for AuditBackend {
    fn default() -> AuditBackend {
        AuditBackend::Noop
    }
}

/// Supported authenticators and their configuration options.
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(tag = "backend")]
pub enum AuthenticatorBackend {
    /// Debug authenticator to allow all requests.
    #[cfg(debug_assertions)]
    #[serde(rename = "allow-all")]
    AllowAll,

    /// Authenticate users with [oauth2_proxy](https://oauth2-proxy.github.io/oauth2-proxy/).
    #[serde(rename = "oauth2-proxy")]
    OAuth2Proxy(OAuth2ProxyConfig),
}

/// Authenticator configuration and backend options.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AuthenticatorConfig {
    /// Selected backend and configuration.
    #[serde(flatten)]
    pub backend: AuthenticatorBackend,

    /// If the authenticator returns a user ID, return it in this response header.
    #[serde(default = "AuthenticatorConfig::default_user_id_header")]
    pub user_id_header: String,
}

impl AuthenticatorConfig {
    pub fn default_user_id_header() -> String {
        "x-auth-request-user".into()
    }
}

/// AuthGateway configuration options.
#[derive(Debug, Deserialize, Serialize)]
pub struct Config {
    /// Configure the audit reporter to use.
    #[serde(default)]
    pub audit: AuditBackend,

    /// Configure the Authentication proxy to use.
    pub authenticator: AuthenticatorConfig,

    /// Bind address for the HTTP server, in the format `address:port`.
    #[serde(default = "Config::default_bind")]
    pub bind: String,

    /// Filter out log events below this severity.
    #[serde(default)]
    pub log_level: LevelFilter,

    /// List of files to load advanced rules from.
    #[serde(default)]
    pub rule_files: Vec<String>,
}

impl Config {
    fn default_bind() -> String {
        "127.0.0.1:8090".into()
    }
}

impl Config {
    /// Load a config object from a yaml file.
    pub fn load<P: AsRef<Path>>(path: P) -> Result<Config> {
        let path = path.as_ref();
        let config = File::open(path)
            .with_context(|| format!("Unable to load configuration from {}", path.display()))?;
        let config = serde_yaml::from_reader(config).with_context(|| {
            format!(
                "Unable to YAML decode configuration from {}",
                path.display()
            )
        })?;
        Ok(config)
    }
}

/// Serialize and Deserialize copy of log::LevelFilter.
#[derive(Debug, Deserialize, Serialize)]
pub enum LevelFilter {
    /// A level lower than all log levels.
    #[serde(rename = "off")]
    Off,

    /// Corresponds to the `Error` log level.
    #[serde(rename = "error")]
    Error,

    /// Corresponds to the `Warn` log level.
    #[serde(rename = "warn")]
    Warn,

    /// Corresponds to the `Info` log level.
    #[serde(rename = "info")]
    Info,

    /// Corresponds to the `Debug` log level.
    #[serde(rename = "debug")]
    Debug,

    /// Corresponds to the `Trace` log level.
    #[serde(rename = "trace")]
    Trace,
}

impl Default for LevelFilter {
    fn default() -> LevelFilter {
        LevelFilter::Info
    }
}

impl From<LevelFilter> for log::LevelFilter {
    fn from(filter: LevelFilter) -> log::LevelFilter {
        match filter {
            LevelFilter::Off => log::LevelFilter::Off,
            LevelFilter::Error => log::LevelFilter::Error,
            LevelFilter::Warn => log::LevelFilter::Warn,
            LevelFilter::Info => log::LevelFilter::Debug,
            LevelFilter::Debug => log::LevelFilter::Debug,
            LevelFilter::Trace => log::LevelFilter::Trace,
        }
    }
}
