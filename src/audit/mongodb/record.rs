use std::time::Duration;

use chrono::DateTime;
use chrono::Utc;
use serde::Deserialize;
use serde::Serialize;

use crate::models::AuditReason;
use crate::models::AuditRecord as NativeAuditRecord;
use crate::models::AuthenticationStatus;
use crate::models::RequestProtocol;

/// AuditRecord with duration encoded in a BSON supported type.
///
/// By default `Duration` objects are encoded using unsigned integers for seconds and nanoseconds.
/// BSON documents don't have support for unsigned integers so encoding fails.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AuditRecord {
    pub authenticated: bool,
    pub protocol: RequestProtocol,
    pub reason: AuditReason,
    pub resource: String,
    pub result: AuthenticationStatus,
    pub session_id: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub user_id: Option<String>,

    /// Duration in a BSON compatible format.
    pub duration: SignedDuration,
}

impl From<NativeAuditRecord> for AuditRecord {
    fn from(native: NativeAuditRecord) -> AuditRecord {
        AuditRecord {
            authenticated: native.authenticated,
            duration: native.duration.into(),
            protocol: native.protocol,
            reason: native.reason,
            resource: native.resource,
            result: native.result,
            session_id: native.session_id,
            timestamp: native.timestamp,
            user_id: native.user_id,
        }
    }
}

/// A version of the decomposed Duration using signed integers.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SignedDuration {
    pub secs: i64,
    pub nanos: i64,
}

impl From<Duration> for SignedDuration {
    fn from(duration: Duration) -> SignedDuration {
        // NOTE: We force unsigned 64 bits integers into signed ones for BSON.
        // NOTE: This will cause issues for large durations but we'll be lazy and not care.
        let secs = duration.as_secs() as i64;
        let nanos = duration.subsec_nanos() as i64;
        SignedDuration { secs, nanos }
    }
}
