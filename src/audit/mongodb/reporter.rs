use anyhow::Result;
use mongodb::options::ClientOptions;
use mongodb::Client;
use mongodb::Collection;

use crate::audit::AuditReporter;
use crate::audit::Auditor;
use crate::audit::AuditorFactory;
use crate::config::MongoDBAuditConfig;
use crate::models::AuditRecord;

use super::record::AuditRecord as MongoDBAuditRecord;

/// AuditReporter that records in a MongoDB collection.
pub struct Reporter {
    collection: Collection<MongoDBAuditRecord>,
}

#[async_trait::async_trait(?Send)]
impl AuditReporter for Reporter {
    async fn send(&self, record: AuditRecord) -> Result<()> {
        let record = record.into();
        self.collection.insert_one(record, None).await?;
        Ok(())
    }
}

/// Thread safe factory to create MongoDB `AuditReporter`s sharing the same client.
pub struct ReporterFactory {
    collection: Collection<MongoDBAuditRecord>,
}

impl ReporterFactory {
    /// Initialise a new MongoDB client shared by all `AuditReporter` made from this factory.
    pub async fn new(config: MongoDBAuditConfig) -> Result<ReporterFactory> {
        log::debug!("Using MongoDB for audit reporting");
        let mut options = ClientOptions::parse(&config.uri).await?;
        options.app_name = Some(env!("CARGO_PKG_NAME").into());
        let collection = Client::with_options(options)?
            .database(&config.database)
            .collection_with_type(&config.collection);
        Ok(ReporterFactory { collection })
    }
}

impl AuditorFactory for ReporterFactory {
    fn make(&self) -> Auditor {
        Auditor::wrap(Reporter {
            collection: self.collection.clone(),
        })
    }
}
