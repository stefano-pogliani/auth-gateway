use std::collections::HashSet;

use serde::Deserialize;
use serde::Serialize;

/// Define attributes a request's authentication result must match for a rule to be applied.
///
/// All attributes defined must match for a rule to match overall.
#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct RuleSessionMatches {
    /// Match requests by authenticator result.
    #[serde(default)]
    pub authenticated: Option<bool>,

    /// Requests originating from any of these users will match.
    #[serde(default)]
    pub user: HashSet<String>,
}
