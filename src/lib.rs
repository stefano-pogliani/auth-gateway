// TODO:  8 - Rules sources + engine: preauth rules, postauth rules, enrich rules.
// TODO:      - Find first matching enrich rule and enrich response.
// TODO:      - Set configurable header to inject user ID.
// TODO:  9 - Authentication proxies: oauth2_proxy + supporting API endpoint(s).
// TODO:      - Authentication proxy pre-auth rules: trait method?
// TODO:      - Prev version made proxy configuration easy, can I keep that?
// TODO: 10 - Audit support: request hooks + outputs (stdout, HTTP(S) POST).
// TODO: 11 - Metrics: req count & durations, results by action, rules processed & duration.
// TODO: 12 - Review feature partity.
// TODO: 13 - K8s deployment and minikube demo.
// TODO: 14 - Some sort of config helper?
// TODO:      AuthGateway generate a context from config and other sources.
// TODO:      Support rendering of config templates + auth backends provided defaults.
use actix_web::App;
use actix_web::HttpServer;
use anyhow::Result;
use env_logger::Builder;
use log::info;
use structopt::StructOpt;

mod authenticator;
mod config;
mod engine;
mod errors;
mod models;
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
    let authenticator_config = config.authenticator;
    let rules_engine = self::engine::RulesEngine::builder()
        .rule_files(&config.rule_files)
        .build()?;
    let server = HttpServer::new(move || {
        let authenticator = self::authenticator::Authenticator::from_config(
            rules_engine.clone(),
            &authenticator_config,
        );
        App::new()
            .configure(crate::server::configure)
            .data(authenticator)
            .wrap(actix_web::middleware::Logger::default())
    });
    info!("AuthGateway API Starting at {}", &config.bind);
    server.bind(config.bind)?.run().await?;
    info!("AuthGateway exiting");
    Ok(())
}
