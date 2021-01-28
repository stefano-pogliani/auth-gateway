use actix_web::get;
use actix_web::web::ServiceConfig;
use actix_web::HttpResponse;
use actix_web::Responder;

/// Static method to return 200.
#[get("/health")]
async fn health() -> impl Responder {
    HttpResponse::Ok()
}

/// Configure API endpoints.
pub fn configure(app: &mut ServiceConfig) {
    app.service(health);
}
