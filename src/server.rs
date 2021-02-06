use actix_web::get;
use actix_web::web::Data;
use actix_web::web::ServiceConfig;
use actix_web::HttpRequest;
use actix_web::HttpResponse;
use actix_web::Responder;

use crate::authenticator::Authenticator;
use crate::errors::InvalidAuthRequest;
use crate::models::AuthenticationStatus;

/// Endpoint implementing the [auth_request] protocol.
///
/// Required headers:
///  * `Host` - Provides the domain the request to authenticate is for.
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
    authenticator: Data<Authenticator>,
) -> actix_web::Result<impl Responder> {
    // Extract required attributes about the request to check.
    let domain = request
        .headers()
        .get("Host")
        .ok_or(InvalidAuthRequest::NoHost)?;
    let uri = request
        .headers()
        .get("X-Original-URI")
        .ok_or(InvalidAuthRequest::NoUri)?;

    // Build a request context for rules evaluation.
    let context = crate::models::RequestContext {
        domain,
        headers: request.headers(),
        uri,
    };

    // Check the request for authentication and rules.
    let result = authenticator.check(&context, &request);
    // TODO: handle authenticator errors.
    println!("~~~ {:?}", result);
    let result = result.unwrap();

    // Build the auth_request response from the authentication result.
    let response = match result.status {
        AuthenticationStatus::Allowed => HttpResponse::Ok(),
        AuthenticationStatus::Denied => HttpResponse::Forbidden(),
        AuthenticationStatus::MustLogin => HttpResponse::Unauthorized(),
    };
    // TODO: Inject response headers.
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

    use crate::authenticator::Authenticator;

    // Instantiate an Acitx App to run tests against.
    async fn test_app(
    ) -> impl Service<Request = Request, Response = ServiceResponse<Body>, Error = Error> {
        let auth = crate::authenticator::tests::Authenticator::default();
        let app = App::new()
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
    async fn bad_request_without_uri() {
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
            Bytes::from_static(b"Required X-Original-URI header is missing")
        );
    }

    // TODO: check derived RequestContext.
    // TODO: check response when request is allowed.
    // TODO: check response when request is denied.
    // TODO: check response when request is forbidden.
}
