const crypto = require('crypto');
const md5 = require('md5');

const Auditor = require('./auditor');
const { app } = require('./app');
const { getCookieSession } = require('./utils');


/**
 * Verify a request received by the HTTP Poxy for authorization.
 *
 * Return codes:
 *   - 202: The request is allowed.
 *   - 401: The request is NOT allowed.
 */
app.get('/api/auth', (req, res) => {
  const time = Date.now();
  const config = app.get('config');
  const host = req.get('Host');
  const proto = req.get('X-Forwarded-Proto');
  const uri = req.get('X-Original-URI');
  const original_url = `${proto}://${host}${uri}`;
  getCookieSession(req, config, (session) => {
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
    const audit = Auditor.Instance().audit(audit_event)
    return audit.then((audit_opinion) => {
      if (audit_opinion) {
        res.status(audit_opinion).end();
        return;
      }
      
      // Allow/reject the action.
      if (session.allowed) {
        res.status(202).end();
      } else {
        res.status(401).end();
      }
    });
  });
});


/**
 * Implement a besic health check.
 */
app.get('/api/health', (req, res) => {
  res.json({});
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
    session_id = hmac.digest('hex');
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
