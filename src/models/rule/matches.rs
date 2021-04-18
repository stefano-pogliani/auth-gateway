use std::collections::HashMap;
use std::collections::HashSet;

use serde::Deserialize;
use serde::Serialize;

use crate::models::RequestContext;

/// Define attributes a request must match for a rule to be applied.
///
/// All attributes defined must match for a rule to match overall.
#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct RuleMatches {
    /// Any requiest will match.
    #[serde(default = "RuleMatches::default_any")]
    pub any: bool,

    /// Requests for any domains in the list will match.
    #[serde(default)]
    pub domain: HashSet<String>,

    /// Requests with any header set to the corresponding value will match.
    #[serde(default)]
    pub header_equal: HashMap<String, String>,

    /// Requests for any URI in the list will match.
    #[serde(default)]
    pub uri: HashSet<String>,
}

impl RuleMatches {
    /// Check if the context matches this rule.
    pub fn check(&self, context: &RequestContext) -> bool {
        self.any
            || self.domain.contains(context.host)
            || self.uri.contains(context.uri)
            || self.check_header_equal(context)
    }
}

impl RuleMatches {
    fn default_any() -> bool {
        false
    }

    /// Check if the context headers match any of the equality conditions.
    fn check_header_equal(&self, context: &RequestContext) -> bool {
        let header_equal = &self.header_equal;
        context.headers.iter().any(|(name, values)| {
            header_equal
                .get(*name)
                .map(|value| values.contains(&value.as_str()))
                .unwrap_or(false)
        })
    }
}

#[cfg(test)]
mod tests {
    use super::RuleMatches;
    use crate::models::RequestContext;
    use crate::models::RequestProtocol;

    #[test]
    fn match_any() {
        let context = RequestContext {
            headers: Default::default(),
            host: "not.me",
            protocol: RequestProtocol::Https,
            uri: &"/path/to/nowhere",
        };
        let rule = RuleMatches {
            any: true,
            domain: Default::default(),
            header_equal: Default::default(),
            uri: Default::default(),
        };
        assert!(rule.check(&context));
    }

    #[test]
    fn match_domain() {
        let context = RequestContext {
            headers: Default::default(),
            host: "not.me",
            protocol: RequestProtocol::Https,
            uri: &"/path/to/nowhere",
        };
        let rule = RuleMatches {
            any: false,
            domain: {
                let mut set = std::collections::HashSet::new();
                set.insert("me.not".to_string());
                set.insert("not.me".to_string());
                set
            },
            header_equal: Default::default(),
            uri: Default::default(),
        };
        assert!(rule.check(&context));
    }

    #[test]
    fn match_header() {
        let context = RequestContext {
            headers: {
                let mut map = std::collections::HashMap::new();
                map.insert("x-header-check", vec!["no"]);
                map.insert("header-eq-test", vec!["No", "Yes"]);
                map
            },
            host: "not.me",
            protocol: RequestProtocol::Https,
            uri: &"/path/to/nowhere",
        };
        let rule = RuleMatches {
            any: false,
            domain: Default::default(),
            header_equal: {
                let mut map = std::collections::HashMap::new();
                map.insert("x-header-check".to_string(), "No".to_string());
                map.insert("header-eq-test".to_string(), "Yes".to_string());
                map
            },
            uri: Default::default(),
        };
        assert!(rule.check(&context));
    }

    #[test]
    fn match_uri() {
        let context = RequestContext {
            headers: Default::default(),
            host: "not.me",
            protocol: RequestProtocol::Https,
            uri: &"/path/to/nowhere",
        };
        let rule = RuleMatches {
            any: false,
            domain: Default::default(),
            header_equal: Default::default(),
            uri: {
                let mut set = std::collections::HashSet::new();
                set.insert("/path/to/nowhere".to_string());
                set
            },
        };
        assert!(rule.check(&context));
    }
}
