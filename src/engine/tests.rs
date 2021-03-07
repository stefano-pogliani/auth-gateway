use std::collections::HashMap;
use std::collections::HashSet;
use std::convert::TryFrom;

use actix_web::http::HeaderName;
use actix_web::http::HeaderValue;
use actix_web::test::TestRequest;

use super::RulesEngine;
use crate::models::AuthenticationContext;
use crate::models::AuthenticationResult;
use crate::models::EnrichResponseRule;
use crate::models::PostAuthRule;
use crate::models::PreAuthRule;
use crate::models::RequestContext;
use crate::models::RuleAction;
use crate::models::RuleMatches;
use crate::models::RuleSessionMatches;

fn test_request(host: &'static str, uri: &'static str) -> TestRequest {
    TestRequest::get()
        .header("Host", host)
        .header("X-Original-URI", uri)
        .uri("/v1/check")
}

#[test]
fn build_no_rules() {
    let engine = RulesEngine::builder().build().unwrap();
    assert_eq!(engine.rules_enrich, vec![]);
    assert_eq!(engine.rules_postauth, vec![]);
    assert_eq!(engine.rules_preauth, vec![]);
}

#[test]
fn build_one_source() {
    let engine = RulesEngine::builder()
        .rule_files(&[String::from("tests/fixtures/rules_file_1.yaml")])
        .build()
        .unwrap();
    assert_eq!(
        engine.rules_enrich,
        vec![EnrichResponseRule {
            headers_remove: {
                let mut set = HashSet::new();
                set.insert("server".to_string());
                set.insert("version".to_string());
                set
            },
            headers_set: HashMap::default(),
            matches: Some(RuleMatches {
                any: true,
                domain: HashSet::default(),
                header_equal: HashMap::default(),
                uri: HashSet::default(),
            }),
            session_matches: None,
        }]
    );
    assert_eq!(
        engine.rules_postauth,
        vec![PostAuthRule {
            action: RuleAction::Deny,
            matches: None,
            session_matches: Some(RuleSessionMatches {
                authenticated: None,
                user: {
                    let mut set = HashSet::new();
                    set.insert("some@email.com".to_string());
                    set
                }
            }),
        }]
    );
    assert_eq!(
        engine.rules_preauth,
        vec![PreAuthRule {
            action: RuleAction::Allow,
            matches: RuleMatches {
                any: false,
                domain: {
                    let mut set = HashSet::new();
                    set.insert("example.com".to_string());
                    set
                },
                header_equal: HashMap::default(),
                uri: HashSet::default(),
            }
        }]
    );
}

#[test]
fn build_two_sources() {
    let engine = RulesEngine::builder()
        .rule_files(&[
            String::from("tests/fixtures/rules_file_1.yaml"),
            String::from("tests/fixtures/rules_file_2.yaml"),
        ])
        .build()
        .unwrap();
    assert_eq!(engine.rules_enrich.len(), 2);
    assert_eq!(engine.rules_postauth.len(), 2);
    assert_eq!(engine.rules_preauth.len(), 2);
}

#[test]
fn eval_enrich_no_rules() {
    let request = test_request("domain", "/path/to/page").to_http_request();
    let context = RequestContext::try_from(&request).unwrap();
    let engine = RulesEngine::builder().build().unwrap();
    let expected = AuthenticationResult::denied();
    let actual = engine.eval_enrich(&context, expected.clone()).unwrap();
    assert_eq!(format!("{:?}", actual), format!("{:?}", expected));
}

#[test]
fn eval_enrich_rule_does_not_match() {
    let request = test_request("domain", "/path/to/page").to_http_request();
    let context = RequestContext::try_from(&request).unwrap();
    let engine = RulesEngine::builder()
        .rule_enrich(EnrichResponseRule {
            headers_remove: {
                let mut set = HashSet::new();
                set.insert("X-Test-Remove".to_string());
                set.insert("X-Remove".to_string());
                set
            },
            headers_set: {
                let mut map = HashMap::new();
                map.insert("X-Test".to_string(), "set".to_string());
                map
            },
            matches: None,
            session_matches: Some(RuleSessionMatches {
                authenticated: Some(true),
                user: Default::default(),
            }),
        })
        .build()
        .unwrap();
    let mut result = AuthenticationResult::denied();
    result.headers.insert(
        HeaderName::from_static("x-remove"),
        HeaderValue::from_str("kept").unwrap(),
    );
    let result = engine.eval_enrich(&context, result).unwrap();
    let actual = result.headers.get("x-remove").unwrap().to_str().unwrap();
    assert_eq!(actual, "kept");
    assert_eq!(result.headers.get("x-test"), None);
}

#[test]
fn eval_enrich_rule_matches() {
    let request = test_request("domain", "/path/to/page").to_http_request();
    let context = RequestContext::try_from(&request).unwrap();
    let engine = RulesEngine::builder()
        .rule_enrich(EnrichResponseRule {
            headers_remove: {
                let mut set = HashSet::new();
                set.insert("X-Test-Remove".to_string());
                set.insert("X-Remove".to_string());
                set
            },
            headers_set: {
                let mut map = HashMap::new();
                map.insert("X-Test".to_string(), "set".to_string());
                map
            },
            matches: None,
            session_matches: Some(RuleSessionMatches {
                authenticated: Some(false),
                user: Default::default(),
            }),
        })
        .build()
        .unwrap();
    let mut result = AuthenticationResult::denied();
    result.headers.insert(
        HeaderName::from_static("x-remove"),
        HeaderValue::from_str("ok").unwrap(),
    );
    let result = engine.eval_enrich(&context, result).unwrap();
    let actual = result.headers.get("x-test").unwrap().to_str().unwrap();
    assert_eq!(result.headers.get("x-remove"), None);
    assert_eq!(actual, "set");
}

#[test]
fn eval_postauth_no_rules() {
    let request = test_request("domain", "/path/to/page").to_http_request();
    let auth_context = AuthenticationContext::unauthenticated();
    let context = RequestContext::try_from(&request).unwrap();
    let engine = RulesEngine::builder().build().unwrap();
    let action = engine.eval_postauth(&context, &auth_context);
    assert_eq!(action, RuleAction::Delegate);
}

#[test]
fn eval_postauth_rule_allow() {
    let request = test_request("domain", "/path/to/page").to_http_request();
    let auth_context = AuthenticationContext {
        authenticated: true,
        user: None,
    };
    let context = RequestContext::try_from(&request).unwrap();
    let engine = RulesEngine::builder()
        .rule_postauth(PostAuthRule {
            action: RuleAction::Deny,
            matches: None,
            session_matches: Some(RuleSessionMatches {
                authenticated: Some(false),
                user: Default::default(),
            }),
        })
        .rule_postauth(PostAuthRule {
            action: RuleAction::Allow,
            matches: None,
            session_matches: Some(RuleSessionMatches {
                authenticated: Some(true),
                user: Default::default(),
            }),
        })
        .build()
        .unwrap();
    let action = engine.eval_postauth(&context, &auth_context);
    assert_eq!(action, RuleAction::Allow);
}

#[test]
fn eval_postauth_rule_does_not_match() {
    let request = test_request("domain", "/path/to/page").to_http_request();
    let auth_context = AuthenticationContext {
        authenticated: true,
        user: None,
    };
    let context = RequestContext::try_from(&request).unwrap();
    let engine = RulesEngine::builder()
        .rule_postauth(PostAuthRule {
            action: RuleAction::Allow,
            matches: None,
            session_matches: Some(RuleSessionMatches {
                authenticated: Some(false),
                user: Default::default(),
            }),
        })
        .build()
        .unwrap();
    let action = engine.eval_postauth(&context, &auth_context);
    assert_eq!(action, RuleAction::Delegate);
}

#[test]
fn eval_preauth_no_rules() {
    let request = test_request("domain", "/path/to/page").to_http_request();
    let context = RequestContext::try_from(&request).unwrap();
    let engine = RulesEngine::builder().build().unwrap();
    let action = engine.eval_preauth(&context);
    assert_eq!(action, RuleAction::Delegate);
}

#[test]
fn eval_preauth_rule_allow() {
    let request = test_request("domain", "/path/to/page")
        .header("X-Test-Rule-Case", "vAlUe-SeNsItIvE")
        .header("X-Test-Rule-Case", "header-insensitive")
        .to_http_request();
    let context = RequestContext::try_from(&request).unwrap();
    let engine = RulesEngine::builder()
        .rule_preauth(PreAuthRule {
            action: RuleAction::Deny,
            matches: RuleMatches {
                any: false,
                domain: Default::default(),
                header_equal: {
                    let mut map = HashMap::new();
                    map.insert(
                        "x-test-rule-case".to_string(),
                        "value-sensitive".to_string(),
                    );
                    map
                },
                uri: Default::default(),
            },
        })
        .rule_preauth(PreAuthRule {
            action: RuleAction::Allow,
            matches: RuleMatches {
                any: false,
                domain: Default::default(),
                header_equal: {
                    let mut map = HashMap::new();
                    map.insert(
                        "x-test-rule-case".to_string(),
                        "header-insensitive".to_string(),
                    );
                    map
                },
                uri: Default::default(),
            },
        })
        .build()
        .unwrap();
    let action = engine.eval_preauth(&context);
    assert_eq!(action, RuleAction::Allow);
}

#[test]
fn eval_preauth_rule_does_not_match() {
    let request = test_request("domain", "/path/to/page").to_http_request();
    let context = RequestContext::try_from(&request).unwrap();
    let engine = RulesEngine::builder()
        .rule_preauth(PreAuthRule {
            action: RuleAction::Deny,
            matches: RuleMatches {
                any: false,
                domain: {
                    let mut set = HashSet::default();
                    set.insert("not.me".to_string());
                    set
                },
                header_equal: Default::default(),
                uri: Default::default(),
            },
        })
        .build()
        .unwrap();
    let action = engine.eval_preauth(&context);
    assert_eq!(action, RuleAction::Delegate);
}
