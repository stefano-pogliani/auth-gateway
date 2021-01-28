// TODO:  3 - API Auth Endpoint(s): auth_request protocol.
// TODO:  4 - Data models: Rule, PreAuthContext, PostAuthContext.
// TODO:  5 - Development environment: podman based? minikube?.
// TODO:  6 - Authentication proxies: model authentication backends + always yes debug backend.
// TODO:  7 - Rules engine.
// TODO:  8 - Rules sources.
// TODO:  9 - Authentication proxies: oauth2_proxy + supporting API endpoint(s).
// TODO:      - Prev version made proxy configuration easy, can I keep that?
// TODO: 10 - Audit support: request hooks + outputs (stdout, HTTP(S) POST).
// TODO: 11 - Review feature partity.
// TODO: 12 - K8s deployment and minikube demo.
use actix_web::App;
use actix_web::HttpServer;
use anyhow::Result;
use env_logger::Builder;
use log::info;
use structopt::StructOpt;

mod config;
mod server;

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
    builder.filter_level(config.log_level.into()).init();

    // Configure and start the API server.
    let server = HttpServer::new(|| {
        App::new()
            .configure(crate::server::configure)
            .wrap(actix_web::middleware::Logger::default())
    });
    info!("AuthGateway API Starting at {}", &config.bind);
    server.bind(config.bind)?.run().await?;
    info!("AuthGateway exiting");
    Ok(())
}
