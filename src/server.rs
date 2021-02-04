use actix_web::get;
use actix_web::web::ServiceConfig;
use actix_web::HttpRequest;
use actix_web::HttpResponse;
use actix_web::Responder;

use crate::errors::InvalidAuthRequest;

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
async fn check(request: HttpRequest) -> actix_web::Result<impl Responder> {
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

    // TODO: Build a response from the resul.
    println!("~~~ {:?}", context);
    //let response = HttpResponse::Ok();
    let response = HttpResponse::Unauthorized();
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
    use actix_web::http::StatusCode;
    use actix_web::test;
    use actix_web::web::Bytes;
    use actix_web::App;

    #[actix_rt::test]
    async fn bad_request_without_host() {
        let app = App::new().service(super::check);
        let mut app = test::init_service(app).await;
        let request = test::TestRequest::get().uri("/v1/check").to_request();
        let response = test::call_service(&mut app, request).await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = test::read_body(response).await;
        assert_eq!(body, Bytes::from_static(b"Required Host header is missing"));
    }

    #[actix_rt::test]
    async fn bad_request_without_uri() {
        let app = App::new().service(super::check);
        let mut app = test::init_service(app).await;
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
