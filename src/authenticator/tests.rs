use actix_web::http::HeaderMap;
use actix_web::http::HeaderName;
use actix_web::http::HeaderValue;
use actix_web::HttpRequest;
use anyhow::Result;

use crate::authenticator::AuthenticationProxy;
use crate::models::AuthenticationContext;
use crate::models::AuthenticationResult;
use crate::models::AuthenticationStatus;
use crate::models::RequestContext;

/// Mock authenticator for tests.
pub struct Authenticator {
    check_result: AuthenticationStatus,
    fail_check: bool,
}

impl Authenticator {
    pub fn denied() -> Authenticator {
        let mut auth = Authenticator::default();
        auth.check_result = AuthenticationStatus::Denied;
        auth
    }

    pub fn failing() -> Authenticator {
        let mut auth = Authenticator::default();
        auth.fail_check = true;
        auth
    }

    pub fn must_login() -> Authenticator {
        let mut auth = Authenticator::default();
        auth.check_result = AuthenticationStatus::MustLogin;
        auth
    }
}

impl AuthenticationProxy for Authenticator {
    fn check(&self, _: &RequestContext, _: &HttpRequest) -> Result<AuthenticationResult> {
        if self.fail_check {
            anyhow::bail!("Test request check returning error");
        }
        let authentication_context = AuthenticationContext::unauthenticated();
        let mut headers = HeaderMap::new();
        headers.append(
            HeaderName::from_static("x-test-header"),
            HeaderValue::from_static("Value2"),
        );
        headers.insert(
            HeaderName::from_static("x-authenticator"),
            HeaderValue::from_static("Tests"),
        );
        headers.append(
            HeaderName::from_static("x-test-header"),
            HeaderValue::from_static("Value1"),
        );
        let status = self.check_result;
        Ok(AuthenticationResult {
            authentication_context,
            headers,
            status,
        })
    }
}

impl Default for Authenticator {
    fn default() -> Authenticator {
        Authenticator {
            check_result: AuthenticationStatus::Allowed,
            fail_check: false,
        }
    }
}
