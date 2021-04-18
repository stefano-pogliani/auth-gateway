use crate::models::AuthenticationResult;
use crate::models::AuthenticationStatus;
use crate::models::RequestContext;
use crate::models::RequestProtocol;

use super::AuditReason;
use super::AuditRecordBuilder;

#[test]
fn finish_audit_record() {
    let context = RequestContext {
        headers: Default::default(),
        host: "not.me",
        protocol: RequestProtocol::Https,
        uri: &"/path/to/nowhere",
    };
    let result = AuthenticationResult::from_status(AuthenticationStatus::MustLogin);
    let audit = AuditRecordBuilder::start(&context);
    let audit = audit.finish(&result);
    assert_eq!(audit.authenticated, false);
    assert_eq!(audit.protocol, RequestProtocol::Https);
    assert_eq!(audit.reason, AuditReason::InvalidSession);
    assert_eq!(audit.resource, "https://not.me/path/to/nowhere");
    assert_eq!(audit.result, AuthenticationStatus::MustLogin);
    assert_eq!(audit.session_id, None);
    assert_eq!(audit.user_id, None);
}

#[test]
fn start_audit_record() {
    let context = RequestContext {
        headers: Default::default(),
        host: "not.me",
        protocol: RequestProtocol::Https,
        uri: &"/path/to/nowhere",
    };
    let audit = AuditRecordBuilder::start(&context);
    assert_eq!(audit.protocol, RequestProtocol::Https);
    assert_eq!(audit.resource, "https://not.me/path/to/nowhere");
}
