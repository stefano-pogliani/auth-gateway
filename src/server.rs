use actix_web::get;
use actix_web::web::ServiceConfig;
use actix_web::HttpResponse;
use actix_web::Responder;

/// Endpoint implementing the auth_request protocol.
#[get("/v1/check")]
async fn check() -> impl Responder {
    // TODO: request domain.
    // TODO: request URI.
    // TODO: return 400 if required request attributes are missing.
    //HttpResponse::Ok()
    HttpResponse::Unauthorized()
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
