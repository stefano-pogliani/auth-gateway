const { app } = require('../app');
const { getSession } = require('../utils');

const { AuditRecord } = require('../auditor/record');
const { AuditedResponse } = require('./utils');
const { CheckAuditedRequest } = require('../auth_logic');

const { REQUEST_DURATION } = require('./metrics');


/**
 * Audit a request received by the HTTP Proxy.
 *
 * Audited requests are always allowed (unless the auditor fails) and are
 * usually combined with upstreams that implement their own authentication.
 * Session information is therefore mostly unavailable.
 *
 * Return codes:
 *   - 202: The request is allowed.
 *   - Other: Code possibly returned by the auditor (on error).
 */
app.get('/api/audit', (req, res) => {
  const recordDuration = REQUEST_DURATION.labels('/api/audit').startTimer();
  const config = app.get('config');
  const time = Date.now();
  return getSession(req, config).then((session) => {
    const result = CheckAuditedRequest(session);
    const audit_event = AuditRecord(req, session, result, 'https', time);
    return AuditedResponse(audit_event, result);

  }).then((code) => {
    res.status(code).end();

  // Always record the duration of a request.
  }).then(
    () => recordDuration(),
    /* istanbul ignore next */
    (err) => {
      recordDuration();
      throw err;
    }
  );
});
