use std::collections::HashMap;
use std::collections::HashSet;

use serde::Deserialize;
use serde::Serialize;

use crate::models::AuthenticationContext;
use crate::models::RequestContext;

mod matches;
mod session_matches;

pub use self::matches::RuleMatches;
pub use self::session_matches::RuleSessionMatches;

/// Configure a response customisation rule.
///
/// Modifies are applied in the following order:
/// * headers_remove
/// * headers_set
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct EnrichResponseRule {
    /// Remove headers before sending the response.
    #[serde(default)]
    pub headers_remove: HashSet<String>,

    /// Set response headers to the provided value, overriding any existing one.
    #[serde(default)]
    pub headers_set: HashMap<String, String>,

    /// Match requests to apply this rule to.
    #[serde(default)]
    pub matches: Option<RuleMatches>,

    /// Match requests to apply this rule to based on authentication results.
    #[serde(default)]
    pub session_matches: Option<RuleSessionMatches>,
}

impl EnrichResponseRule {
    /// Check if the contexts match this rule.
    pub fn check(&self, context: &RequestContext, auth_context: &AuthenticationContext) -> bool {
        (self.matches.is_some() || self.session_matches.is_some())
            && self
                .matches
                .as_ref()
                .map(|matches| matches.check(context))
                .unwrap_or(true)
            && self
                .session_matches
                .as_ref()
                .map(|matches| matches.check(auth_context))
                .unwrap_or(true)
    }
}

/// Configure an authentication rule to run after authentication is performed.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct PostAuthRule {
    /// Set the authentication action for matching requests.
    pub action: RuleAction,

    /// Match requests to apply this rule to.
    #[serde(default)]
    pub matches: Option<RuleMatches>,

    /// Match requests to apply this rule to based on authentication results.
    #[serde(default)]
    pub session_matches: Option<RuleSessionMatches>,
}

impl PostAuthRule {
    /// Check if the contexts match this rule.
    pub fn check(&self, context: &RequestContext, auth_context: &AuthenticationContext) -> bool {
        (self.matches.is_some() || self.session_matches.is_some())
            && self
                .matches
                .as_ref()
                .map(|matches| matches.check(context))
                .unwrap_or(true)
            && self
                .session_matches
                .as_ref()
                .map(|matches| matches.check(auth_context))
                .unwrap_or(true)
    }
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

impl PreAuthRule {
    /// Check if the context matches this rule.
    pub fn check(&self, context: &RequestContext) -> bool {
        self.matches.check(context)
    }
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
