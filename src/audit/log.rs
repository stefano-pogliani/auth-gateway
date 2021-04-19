use anyhow::Result;

use crate::models::AuditRecord;

use super::AuditReporter;
use super::Auditor;
use super::AuditorFactory;

/// AuditReporter that sends all records to the log crate.
pub struct LogReporter {}

impl AuditorFactory for LogReporter {
    fn make(&self) -> Auditor {
        Auditor::wrap(LogReporter {})
    }
}

#[async_trait::async_trait(?Send)]
impl AuditReporter for LogReporter {
    async fn send(&self, record: AuditRecord) -> Result<()> {
        let record = serde_json::to_string(&record)?;
        log::info!("{}", record);
        Ok(())
    }
}
