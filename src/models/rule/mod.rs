use std::collections::HashMap;
use std::collections::HashSet;

use serde::Deserialize;
use serde::Serialize;

mod matches;
mod session_matches;

pub use self::matches::RuleMatches;
pub use self::session_matches::RuleSessionMatches;

/// Configure a response customisation rule.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct EnrichResponseRule {
    /// Remove headers before sending the response.
    #[serde(default)]
    pub headers_remove: HashSet<String>,

    /// Set response headers to the provided value, overriding any existing one.
    #[serde(default)]
    pub headers_set: HashMap<String, String>,

    /// Match requests to enrich with this rule.
    pub matches: RuleMatches,
}

/// Configure an authentication rule to run after authentication is performed.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct PostAuthRule {
    /// Set the authentication action for matching requests.
    pub action: RuleAction,

    /// Match requests to apply this rule to.
    #[serde(default)]
    pub matches: RuleMatches,

    /// Match requests to apply this rule to based on authentication results.
    #[serde(default)]
    pub session_matches: RuleSessionMatches,
}

/// Configure an authentication rule to run before authentication is performed.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct PreAuthRule {
    /// Set the authentication action for matching requests.
    ///
    /// If the action is definitive (allow, deny) the request is not sent to the authenticator.
    pub action: RuleAction,

    /// Match requests to apply this rule to.
    pub matches: RuleMatches,
}

/// Advanced rules to process requests.
#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "phase")]
pub enum Rule {
    /// Rule to customise authenticate responses being sent back.
    #[serde(rename = "enrich-response")]
    EnrichResponse(EnrichResponseRule),

    /// Rule to override authentication decisions after they are checked with authenticators.
    #[serde(rename = "post-auth")]
    PostAuth(PostAuthRule),

    /// Rule to override authentication decisions before they are checked with authenticators.
    #[serde(rename = "pre-auth")]
    PreAuth(PreAuthRule),
}

/// Possible actions to perform when authentication rules match.
#[derive(Copy, Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum RuleAction {
    /// Unconditionally allow the request.
    #[serde(rename = "allow")]
    Allow,

    /// Delegate the authentication result to the authenticator.
    #[serde(rename = "delegate")]
    Delegate,

    /// Unconditionally deny the request.
    #[serde(rename = "deny")]
    Deny,
}
