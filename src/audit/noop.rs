use anyhow::Result;

use crate::models::AuditRecord;

use super::AuditReporter;
use super::Auditor;
use super::AuditorFactory;

/// AuditReporter that drops all records
pub struct NoopReporter {}

impl AuditorFactory for NoopReporter {
    fn make(&self) -> Auditor {
        Auditor::wrap(NoopReporter {})
    }
}

#[async_trait::async_trait(?Send)]
impl AuditReporter for NoopReporter {
    async fn send(&self, _: AuditRecord) -> Result<()> {
        Ok(())
    }
}
