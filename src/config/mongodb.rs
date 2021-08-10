use serde::Deserialize;
use serde::Serialize;

/// Configuration options for the MongoDB audit reporter.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct MongoDBAuditConfig {
    /// Collection to insert audit records into.
    #[serde(default = "MongoDBAuditConfig::default_collection")]
    pub collection: String,

    /// Database to insert audit records into.
    pub database: String,

    /// MongoDB connection URI string.
    pub uri: String,
}

impl MongoDBAuditConfig {
    fn default_collection() -> String {
        "audit".into()
    }
}
