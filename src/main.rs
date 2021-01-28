#[actix_web::main]
async fn main() -> anyhow::Result<()> {
    authgateway::run().await
}
