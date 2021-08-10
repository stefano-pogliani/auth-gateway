use std::sync::Arc;

use anyhow::Result;

use crate::config::AuditBackend;
use crate::models::AuditRecord;

mod log;
mod mongodb;
mod noop;

/// Wrap an audit record backend with a fixed type and common logic.
pub struct Auditor(Box<dyn AuditReporter>);

impl Auditor {
    /// Send the given AuditRecord to the configured backend.
    pub async fn send(&self, record: AuditRecord) -> Result<()> {
        self.0.send(record).await
    }

    /// Create an AuditorFactory trait object from configuration options.
    pub async fn factory(config: AuditBackend) -> Result<Arc<dyn AuditorFactory>> {
        match config {
            AuditBackend::Log => Ok(Arc::new(self::log::LogReporter {})),
            AuditBackend::MongoDB(config) => {
                let factory = self::mongodb::ReporterFactory::new(config);
                Ok(Arc::new(factory.await?))
            }
            AuditBackend::Noop => Ok(Arc::new(self::noop::NoopReporter {})),
        }
    }

    /// Wrap an implementation specific `AuditReporter`.
    pub fn wrap<A>(auditor: A) -> Auditor
    where
        A: AuditReporter + 'static,
    {
        Auditor(Box::new(auditor))
    }
}

/// Thread-safe logic to create thread-scoped `Auditor` instances.
///
/// This is required to allow implementations to initiate and share global state once
/// for the entire process while also allowing the use of thread-scoped objects where needed.
///
/// For example:
///  * The MongoDB reporter can create a single thread-safe `Client` at factory creation.
///  * The HTTPS reporter can create an `actix_web::client::Client` for each thread at make time.
pub trait AuditorFactory: Send + Sync {
    /// Return a new `Auditor` instance.
    fn make(&self) -> Auditor;
}

/// Interface to report `AuditRecord`s to different backends.
#[async_trait::async_trait(?Send)]
pub trait AuditReporter {
    /// Implementation specific logic to send an AuditRecord to a backend.
    async fn send(&self, record: AuditRecord) -> Result<()>;
}
