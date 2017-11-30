const Auditor = require('../auditor');
const { app } = require('../app');
const { getSession } = require('../utils');

const {
  AUTH_REQUESTS,
  REQUEST_DURATION
} = require('./metrics');


/**
 * Verify a request received by the HTTP Poxy for authorization.
 *
 * Return codes:
 *   - 202: The request is allowed.
 *   - 401: The request is NOT allowed.
 */
app.get('/api/auth', (req, res) => {
  const recordDuration = REQUEST_DURATION.labels('/api/auth').startTimer();
  const time = Date.now();
  const config = app.get('config');
  const host = req.get('Host');
  const proto = req.get('X-Forwarded-Proto');
  const uri = req.get('X-Original-URI');
  const original_url = `${proto}://${host}${uri}`;
  return getSession(req, config).then((session) => {
    // Audit the request.
    const audit_event = {
      email: session.email,
      protocol: 'https',
      resource: original_url,
      result: session.allowed ? 'allow' : 'deny',
      session_id: session.id,
      timestamp: time,
      user: session.user
    };
    return Auditor.Instance().audit(audit_event).then((audit_opinion) => {
      return {
        audit_opinion: audit_opinion,
        session: session
      };
    });

  }).then(({audit_opinion, session}) => {
    let allowed = null;
    if (audit_opinion) {
      /* istanbul ignore next */
      allowed = audit_opinion < 200 && audit_opinion >= 300;
      res.status(audit_opinion).end();
    } else if (session.allowed) {
      allowed = true;
      res.status(202).end();
    } else {
      allowed = false;
      res.status(401).end();
    }
    AUTH_REQUESTS.labels(allowed ? 'allowed' : 'denied').inc();

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
