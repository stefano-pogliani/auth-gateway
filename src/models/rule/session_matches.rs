use std::collections::HashSet;

use serde::Deserialize;
use serde::Serialize;

use crate::models::AuthenticationContext;

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

impl RuleSessionMatches {
    /// Check if the contexts match this rule.
    pub fn check(&self, auth_context: &AuthenticationContext) -> bool {
        let authenticated = self
            .authenticated
            .map(|authenticated| authenticated == auth_context.authenticated)
            .unwrap_or(false);
        authenticated
            || auth_context
                .user
                .as_ref()
                .map(|user| self.user.contains(user))
                .unwrap_or(false)
    }
}

#[cfg(test)]
mod tests {
    use super::RuleSessionMatches;
    use crate::models::AuthenticationContext;

    #[test]
    fn match_authenticated() {
        let context = AuthenticationContext {
            authenticated: true,
            user: None,
        };
        let rule = RuleSessionMatches {
            authenticated: Some(true),
            user: Default::default(),
        };
        assert!(rule.check(&context));
    }

    #[test]
    fn match_unauthenticated() {
        let context = AuthenticationContext {
            authenticated: false,
            user: None,
        };
        let rule = RuleSessionMatches {
            authenticated: Some(false),
            user: Default::default(),
        };
        assert!(rule.check(&context));
    }

    #[test]
    fn match_user() {
        let context = AuthenticationContext {
            authenticated: true,
            user: Some("email@dev.local".to_string()),
        };
        let rule = RuleSessionMatches {
            authenticated: None,
            user: {
                let mut set = std::collections::HashSet::new();
                set.insert("some@email.local".to_string());
                set.insert("email@dev.local".to_string());
                set
            },
        };
        assert!(rule.check(&context));
    }

    #[test]
    fn never_match_authenticated_not_set() {
        let context = AuthenticationContext {
            authenticated: true,
            user: None,
        };
        let rule = RuleSessionMatches {
            authenticated: None,
            user: Default::default(),
        };
        assert!(!rule.check(&context));
        let context = AuthenticationContext {
            authenticated: false,
            user: None,
        };
        assert!(!rule.check(&context));
    }

    #[test]
    fn never_match_user_not_set() {
        let context = AuthenticationContext {
            authenticated: true,
            user: Some("email@dev.local".to_string()),
        };
        let rule = RuleSessionMatches {
            authenticated: None,
            user: Default::default(),
        };
        assert!(!rule.check(&context));
    }
}
