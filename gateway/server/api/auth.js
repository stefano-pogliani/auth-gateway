const { app } = require('../app');
const { getSession } = require('../utils');

const { AuditRecord } = require('../auditor/record');
const { AuditedResponse } = require('./utils');
const { CheckProtectedRequest } = require('../auth_logic');

const { REQUEST_DURATION } = require('./metrics');


/**
 * Verify a request received by the HTTP Poxy for authorization.
 *
 * Return codes:
 *   - 202: The request is allowed.
 *   - 401: The request is NOT allowed.
 */
app.get('/api/auth', (req, res) => {
  const recordDuration = REQUEST_DURATION.labels('/api/auth').startTimer();
  const config = app.get('config');
  const time = Date.now();
  return getSession(req, config).then((session) => {
    const result = CheckProtectedRequest(session);
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
