const Auditor = require('../auditor');
const { AUTH_REQUESTS } = require('./metrics');


/**
 * Audits a request and determines the HTTP response code.
 *
 * This is a convenience function for endpoints that need
 * to audit a request and generate a response compatible
 * with NGINX's auth_request directive.
 *
 * The decisions are made elsewhere and passed to this
 * function for final processing.
 */
module.exports.AuditedResponse = (audit_event, result) => {
  return Auditor.Instance().audit(audit_event).then((audit_opinion) => {
    let allowed = null;
    let code = null;
    if (audit_opinion) {
      /* istanbul ignore next */
      allowed = audit_opinion < 200 && audit_opinion >= 300;
      code = audit_opinion;
    } else if (result.allowed) {
      allowed = true;
      code = 202;
    } else {
      allowed = false;
      code = 401;
    }
    AUTH_REQUESTS.labels(allowed ? 'allowed' : 'denied').inc();
    return code;
  });
};
