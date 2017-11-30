const crypto = require('crypto');
const md5 = require('md5');

const register = require('prom-client').register;
const Counter = require('prom-client').Counter;
const Histogram = require('prom-client').Histogram;

const Auditor = require('./auditor');
const { app } = require('./app');
const { getSession } = require('./utils');

const REQUEST_DURATION = new Histogram({
  name: 'authgateway_request_duration',
  help: 'Duration (in seconds) of an endpoint call',
  labelNames: ['endpoint'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5]
});

const AUTH_REQUESTS = new Counter({
  name: 'authgateway_auth_requests',
  help: 'Number of /api/auth requests served',
  labelNames: ['result']
});


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


/**
 * Implement a besic health check.
 */
app.get('/api/health', (req, res) => {
  res.json({});
});


/**
 * Expose prometheous metrics.
 */
app.get('/api/proxied/metrics', (req, res) => {
	res.set('Content-Type', register.contentType);
	res.end(register.metrics());
});


/**
 * Returns user and session details.
 *
 * User not logged in:
 * ```
 * {
 *   "allowed": false,
 *   "email": null,
 *   "gravatar": null,
 *   "id": null,
 *   "user": null
 * }
 * ```
 *
 * User logged in:
 * ```
 * {
 *   "allowed": true,
 *   "email": "abc@example.com",
 *   "gravatar": "hash",
 *   "id": "1234",
 *   "user": "abc"
 * }
 * ```
 */
app.get('/api/proxied/session', (req, res) => {
  const email = req.get('X-Forwarded-Email');
  const token = req.get('X-Forwarded-Access-Token');
  const user = req.get('X-Forwarded-User');

  const config = app.get('config');
  const algo = config.gateway.token_hmac_algorithm;
  const seed = config.auth_proxy.session.secret;

  let session_id = null;
  if (token) {
    const hmac = crypto.createHmac(algo, seed);
    hmac.update(token);
    session_id = hmac.digest('base64');
  }

  let session = {
    allowed: !!user,
    email: email || null,
    gravatar: null,
    id: session_id,
    user: user || null
  };
  if (email) {
    session.gravatar = md5(email.trim().toLowerCase());
  }
  res.json(session);
});
