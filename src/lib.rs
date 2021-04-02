// TODO:  9 - Authentication proxies: oauth2_proxy + supporting API endpoint(s).
// TODO:      - Convert OAuth2Proxy response to AuthenticationResult.
// TODO: 10 - Audit support: request hooks + outputs (stdout, HTTP(S) POST).
// TODO: 11 - Metrics: req count & durations, results by action, rules processed & duration.
// TODO: 12 - Review feature partity.
// TODO: 13 - K8s deployment and minikube demo.
// TODO: 14 - GitHub actions for tests and lints.
// TODO? 15 - Some sort of config helper?
// TODO?      AuthGateway generate a context from config and other sources.
// TODO?      Support rendering of config templates + auth backends provided defaults.
// ROADMAP: Support for OAuth2Proxy cookie refresh (return Set-Cookie header from oauth2_proxy).
// ROADMAP: Additional user identity: Email and Peferred-Username.
// ROADMAP: Authorization phase to lookup groups (post authenticate; pre enrigh).
//          - User ID key to lookup groups (list of strings).
//          - Support different lookup backends but only one at a time.
//          - Filter roles in enrich phase? (use case: limit groups to app they are for).
//          - Configurable concatentation method (with overrides in enrigh phase).
// ROADMAP: Static roles lookup: all users get list of groups.
// ROADMAP: File roles lookup: YAML/JSON files indexed by user id.
// ROADMAP: LDAP roles lookup: memberOf attribute from user-driven LDAP search.
// ROADMAP: Authentication attributes: a space for authenticators to store extra use info (use case: saml assertions).
// ROADMAP: Authentication attributes lookup (use case: SAML assertions to user roles).
use actix_web::App;
use actix_web::HttpServer;
use anyhow::Result;
use env_logger::Builder;
use structopt::StructOpt;

mod authenticator;
mod config;
mod engine;
mod errors;
mod models;
mod server;

use self::authenticator::Authenticator;
use self::authenticator::IdentityHeaders;

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
    let identity_headers = IdentityHeaders::from_config(&authenticator_config)?;
    let rules_engine = self::engine::RulesEngine::builder()
        .rule_files(&config.rule_files)
        .build()?;
    let server = HttpServer::new(move || {
        let authenticator = Authenticator::from_config(
            identity_headers.clone(),
            rules_engine.clone(),
            &authenticator_config,
        );
        App::new()
            .configure(crate::server::configure)
            .data(authenticator)
            .wrap(actix_web::middleware::Logger::default())
    });
    log::info!("AuthGateway API Starting at {}", &config.bind);
    server.bind(config.bind)?.run().await?;
    log::info!("AuthGateway exiting");
    Ok(())
}
