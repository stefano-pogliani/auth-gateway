use std::convert::TryFrom;

use actix_web::get;
use actix_web::web::Data;
use actix_web::web::ServiceConfig;
use actix_web::HttpRequest;
use actix_web::HttpResponse;
use actix_web::Responder;

use crate::audit::Auditor;
use crate::authenticator::Authenticator;
use crate::errors::AuditSendError;
use crate::errors::AuthenticationCheckError;
use crate::models::AuditRecordBuilder;
use crate::models::AuthenticationStatus;
use crate::models::RequestContext;

/// Endpoint implementing the [auth_request] protocol.
///
/// Required headers:
///  * `Host` - Provides the domain the request to authenticate is for.
///  * `X-Forwarded-Proto` - Provides the protocol the request to authenticate is using.
///  * `X-Original-URI` - Provides the URI the request to authenticate is requesting.
///
/// Returns the following codes:
///  * 200 - The request is allowed.
///  * 400 - The request is missing required attributes (`Host`, `X-Original-URI`).
///  * 401 - The request is not allowed, user should authenticate themselves.
///  * 403 - The request is authenticated but not allowed.
///
/// [auth_request]: https://nginx.org/en/docs/http/ngx_http_auth_request_module.html
#[get("/v1/check")]
async fn check(
    request: HttpRequest,
    auditor: Data<Auditor>,
    authenticator: Data<Authenticator>,
) -> actix_web::Result<impl Responder> {
    // Extract required attributes about the request to check.
    let context = RequestContext::try_from(&request)?;

    // Check the request for authentication and rules.
    let audit = AuditRecordBuilder::start(&context);
    let result = authenticator
        .check(&context, &request)
        .await
        .map_err(AuthenticationCheckError::from)?;
    let audit = audit.finish(&result);

    // Build the auth_request response from the authentication result.
    let mut response = match result.status {
        AuthenticationStatus::Allowed => HttpResponse::Ok(),
        AuthenticationStatus::Denied => HttpResponse::Forbidden(),
        AuthenticationStatus::MustLogin => HttpResponse::Unauthorized(),
    };
    for (header, value) in result.headers.iter() {
        response.header(header, value.to_owned());
    }
    if let Some(user) = result.authentication_context.user {
        response.header(&authenticator.headers.user_id, user);
    }

    // Send audit record to configured auditor.
    auditor.send(audit).await.map_err(AuditSendError::from)?;
    Ok(response)
}

/// Static method to return 200.
#[get("/v1/health")]
async fn health() -> impl Responder {
    HttpResponse::Ok()
}

/// Configure API endpoints.
pub fn configure(app: &mut ServiceConfig) {
    app.service(check).service(health);
}

#[cfg(test)]
mod tests {
    use actix_http::Request;
    use actix_web::dev::Body;
    use actix_web::dev::Service;
    use actix_web::dev::ServiceResponse;
    use actix_web::http::StatusCode;
    use actix_web::test;
    use actix_web::web::Bytes;
    use actix_web::App;
    use actix_web::Error;

    use crate::audit::Auditor;
    use crate::authenticator::Authenticator;
    use crate::config::AuditBackend;
    use crate::config::AuthenticatorConfig;

    // Create an Acitx App to run tests using the default test authenticator.
    async fn test_app(
    ) -> impl Service<Request = Request, Response = ServiceResponse<Body>, Error = Error> {
        let auth = crate::authenticator::tests::Authenticator::default();
        test_app_with_authenticator(auth).await
    }

    // Create an Acitx App to run tests using the provided test authenticator.
    async fn test_app_with_authenticator(
        auth: crate::authenticator::tests::Authenticator,
    ) -> impl Service<Request = Request, Response = ServiceResponse<Body>, Error = Error> {
        let auditor = Auditor::factory(AuditBackend::Noop).unwrap();
        let app = App::new()
            .data(auditor.make())
            .data(Authenticator::from(auth))
            .service(super::check);
        test::init_service(app).await
    }

    #[actix_rt::test]
    async fn bad_request_without_host() {
        let mut app = test_app().await;
        let request = test::TestRequest::get().uri("/v1/check").to_request();
        let response = test::call_service(&mut app, request).await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = test::read_body(response).await;
        assert_eq!(body, Bytes::from_static(b"Required Host header is missing"));
    }

    #[actix_rt::test]
    async fn bad_request_without_protocol() {
        let mut app = test_app().await;
        let request = test::TestRequest::get()
            .header("Host", "domain.example.com")
            .uri("/v1/check")
            .to_request();
        let response = test::call_service(&mut app, request).await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = test::read_body(response).await;
        assert_eq!(
            body,
            Bytes::from_static(b"Required X-Forwarded-Proto header is missing")
        );
    }

    #[actix_rt::test]
    async fn bad_request_without_uri() {
        let mut app = test_app().await;
        let request = test::TestRequest::get()
            .header("Host", "domain.example.com")
            .header("X-Forwarded-Proto", "https")
            .uri("/v1/check")
            .to_request();
        let response = test::call_service(&mut app, request).await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = test::read_body(response).await;
        assert_eq!(
            body,
            Bytes::from_static(b"Required X-Original-URI header is missing")
        );
    }

    #[actix_rt::test]
    async fn check_allowed() {
        let mut app = test_app().await;
        let request = test::TestRequest::get()
            .header("Host", "domain.example.com")
            .header("X-Forwarded-Proto", "https")
            .header("X-Original-URI", "/")
            .uri("/v1/check")
            .to_request();
        let response = test::call_service(&mut app, request).await;
        assert_eq!(response.status(), StatusCode::OK);
        let body = test::read_body(response).await;
        assert_eq!(body, Bytes::from_static(b""));
    }

    #[actix_rt::test]
    async fn check_appends_headers() {
        let mut app = test_app().await;
        let request = test::TestRequest::get()
            .header("Host", "domain.example.com")
            .header("X-Forwarded-Proto", "https")
            .header("X-Original-URI", "/")
            .uri("/v1/check")
            .to_request();
        let response = test::call_service(&mut app, request).await;
        let mut actual: Vec<(String, String)> = response
            .headers()
            .iter()
            .map(|(h, v)| (h.to_string(), v.to_str().unwrap().to_string()))
            .collect();
        actual.sort();
        let expected = vec![
            ("x-authenticator".into(), "Tests".into()),
            ("x-test-header".into(), "Value1".into()),
            ("x-test-header".into(), "Value2".into()),
        ];
        assert_eq!(actual, expected);
    }

    #[actix_rt::test]
    async fn check_denied() {
        let auth = crate::authenticator::tests::Authenticator::denied();
        let mut app = test_app_with_authenticator(auth).await;
        let request = test::TestRequest::get()
            .header("Host", "domain.example.com")
            .header("X-Forwarded-Proto", "https")
            .header("X-Original-URI", "/")
            .uri("/v1/check")
            .to_request();
        let response = test::call_service(&mut app, request).await;
        assert_eq!(response.status(), StatusCode::FORBIDDEN);
        let body = test::read_body(response).await;
        assert_eq!(body, Bytes::from_static(b""));
    }

    #[actix_rt::test]
    async fn check_fails() {
        let auth = crate::authenticator::tests::Authenticator::failing();
        let mut app = test_app_with_authenticator(auth).await;
        let request = test::TestRequest::get()
            .header("Host", "domain.example.com")
            .header("X-Forwarded-Proto", "https")
            .header("X-Original-URI", "/")
            .uri("/v1/check")
            .to_request();
        let response = test::call_service(&mut app, request).await;
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
        let body = test::read_body(response).await;
        assert_eq!(
            body,
            Bytes::from_static(
                r#"{
  "error": true,
  "message": "Error checking authentication for a request"
}"#
                .as_bytes()
            )
        );
    }

    #[actix_rt::test]
    async fn check_identity_headers_user_id() {
        let auth = crate::authenticator::tests::Authenticator::alice();
        let mut app = test_app_with_authenticator(auth).await;
        let request = test::TestRequest::get()
            .header("Host", "domain.example.com")
            .header("X-Forwarded-Proto", "https")
            .header("X-Original-URI", "/")
            .uri("/v1/check")
            .to_request();
        let response = test::call_service(&mut app, request).await;
        assert_eq!(response.status(), StatusCode::OK);
        let user_id = response
            .headers()
            .get(AuthenticatorConfig::default_user_id_header())
            .expect("a user ID must be returned");
        assert_eq!(user_id, "alice");
    }

    #[actix_rt::test]
    async fn check_must_login() {
        let auth = crate::authenticator::tests::Authenticator::must_login();
        let mut app = test_app_with_authenticator(auth).await;
        let request = test::TestRequest::get()
            .header("Host", "domain.example.com")
            .header("X-Forwarded-Proto", "https")
            .header("X-Original-URI", "/")
            .uri("/v1/check")
            .to_request();
        let response = test::call_service(&mut app, request).await;
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        let body = test::read_body(response).await;
        assert_eq!(body, Bytes::from_static(b""));
    }
}
