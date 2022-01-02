use std::fs::File;

use actix_web::http::header::HeaderName;
use actix_web::http::header::HeaderValue;
use anyhow::Context;
use anyhow::Result;

use crate::errors::InvalidEnrichResponseRule;
use crate::models::AuthenticationContext;
use crate::models::AuthenticationResult;
use crate::models::EnrichResponseRule;
use crate::models::PostAuthRule;
use crate::models::PreAuthRule;
use crate::models::RequestContext;
use crate::models::Rule;
use crate::models::RuleAction;

#[cfg(test)]
mod tests;

/// Process rules matching requests.
#[derive(Clone, Debug)]
pub struct RulesEngine {
    /// List of response enrichment rules.
    rules_enrich: Vec<EnrichResponseRule>,

    /// List or post-auth phase rules.
    rules_postauth: Vec<PostAuthRule>,

    /// List of pre-auth phase rules.
    rules_preauth: Vec<PreAuthRule>,
}

impl RulesEngine {
    /// Start building a new `RulesEngine`.
    pub fn builder() -> RulesEngineBuilder {
        let files = Vec::new();
        RulesEngineBuilder {
            files,
            rules_enrich: Vec::new(),
            rules_postauth: Vec::new(),
            rules_preauth: Vec::new(),
        }
    }

    /// Evaluate enrich rules.
    pub fn eval_enrich(
        &self,
        context: &RequestContext,
        mut result: AuthenticationResult,
    ) -> Result<AuthenticationResult> {
        // Look for a matching enrich rule.
        let rule = self
            .rules_enrich
            .iter()
            .find(|rule| rule.check(context, &result.authentication_context));

        // Return the unmodified result if no rule matches.
        let rule = match rule {
            None => return Ok(result),
            Some(rule) => rule,
        };

        // Remove headers.
        for name in &rule.headers_remove {
            let name = HeaderName::from_bytes(name.as_bytes())
                .map_err(anyhow::Error::from)
                .map_err(InvalidEnrichResponseRule::from)?;
            result.headers.remove(name);
        }

        // Set headers.
        for (name, value) in &rule.headers_set {
            let name = HeaderName::from_bytes(name.as_bytes())
                .map_err(anyhow::Error::from)
                .map_err(InvalidEnrichResponseRule::from)?;
            let value = HeaderValue::from_str(value)
                .map_err(anyhow::Error::from)
                .map_err(InvalidEnrichResponseRule::from)?;
            result.headers.insert(name, value);
        }

        // Return the modified result.
        Ok(result)
    }

    /// Evaluate postauth rules.
    pub fn eval_postauth(
        &self,
        context: &RequestContext,
        auth_context: &AuthenticationContext,
    ) -> RuleAction {
        self.rules_postauth
            .iter()
            .find(|rule| rule.check(context, auth_context))
            .map(|rule| rule.action)
            .unwrap_or(RuleAction::Delegate)
    }

    /// Evaluate preauth rules.
    pub fn eval_preauth(&self, context: &RequestContext) -> RuleAction {
        self.rules_preauth
            .iter()
            .find(|rule| rule.check(context))
            .map(|rule| rule.action)
            .unwrap_or(RuleAction::Delegate)
    }
}

/// Builder for `RulesEngine`s.
pub struct RulesEngineBuilder {
    files: Vec<String>,
    rules_enrich: Vec<EnrichResponseRule>,
    rules_postauth: Vec<PostAuthRule>,
    rules_preauth: Vec<PreAuthRule>,
}

impl RulesEngineBuilder {
    /// Process provided options and build the `RulesEngine`.
    pub fn build(self) -> Result<RulesEngine> {
        let mut rules_enrich = self.rules_enrich;
        let mut rules_postauth = self.rules_postauth;
        let mut rules_preauth = self.rules_preauth;

        for file in self.files {
            let rules =
                File::open(&file).with_context(|| format!("Unable to load rules from {}", file))?;
            let rules: Vec<Rule> = serde_yaml::from_reader(rules)
                .with_context(|| format!("Unable to YAML decode rules from {}", file))?;
            for rule in rules {
                match rule {
                    Rule::EnrichResponse(rule) => rules_enrich.push(rule),
                    Rule::PostAuth(rule) => rules_postauth.push(rule),
                    Rule::PreAuth(rule) => rules_preauth.push(rule),
                }
            }
        }

        Ok(RulesEngine {
            rules_enrich,
            rules_postauth,
            rules_preauth,
        })
    }

    /// Load rules from these files.
    ///
    /// These rules are loaded last, when the `RulesEngine` is build.
    pub fn rule_files<'iter, I>(mut self, files: I) -> RulesEngineBuilder
    where
        I: IntoIterator<Item = &'iter String>,
    {
        self.files = files.into_iter().map(String::to_owned).collect();
        self
    }

    /// Insert am enrich phase rule.
    #[cfg(test)]
    pub fn rule_enrich(mut self, rule: EnrichResponseRule) -> RulesEngineBuilder {
        self.rules_enrich.push(rule);
        self
    }

    /// Insert a post-auth phase rule.
    #[cfg(test)]
    pub fn rule_postauth(mut self, rule: PostAuthRule) -> RulesEngineBuilder {
        self.rules_postauth.push(rule);
        self
    }

    /// Insert a pre-auth phase rule.
    #[cfg(test)]
    pub fn rule_preauth(mut self, rule: PreAuthRule) -> RulesEngineBuilder {
        self.rules_preauth.push(rule);
        self
    }
}
