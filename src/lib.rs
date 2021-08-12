use actix_web::App;
use actix_web::HttpServer;
use anyhow::Result;
use env_logger::Builder;
use structopt::StructOpt;

mod audit;
mod authenticator;
mod config;
mod engine;
mod errors;
mod models;
mod server;

use self::audit::Auditor;
use self::authenticator::Authenticator;

#[derive(Debug, StructOpt)]
#[structopt(
    name = "authgateway",
    about = "A flexible authentication helper for HTTPS proxies"
)]
struct Opt {
    /// Path to the AuthGateway configuration file.
    #[structopt(long, short, default_value = "authgateway.yaml")]
    config: String,
}

/// Start the AuthGateway server and run forever.
pub async fn run() -> Result<()> {
    // Parse CLI args and load configuration.
    let options = Opt::from_args();
    let config = crate::config::Config::load(&options.config)?;

    // Configure logging.
    let mut builder = Builder::from_default_env();
    builder.filter_level(config.log_level.clone().into()).init();

    // Configure audit reporter and authenticator proxy.
    let authenticator = Authenticator::factory(&config)?;
    let auditor = Auditor::factory(config.audit).await?;

    // Configure and start the API server.
    let server = HttpServer::new(move || {
        App::new()
            .configure(crate::server::configure)
            .data(auditor.make())
            .data(authenticator.make())
            .wrap(actix_web::middleware::Logger::default())
    });
    log::info!("AuthGateway API Starting at {}", &config.bind);
    server.bind(config.bind)?.run().await?;
    log::info!("AuthGateway exiting");
    Ok(())
}
