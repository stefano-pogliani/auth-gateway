const crypto = require('crypto');
const md5 = require('md5');

const register = require('prom-client').register;

const { app } = require('../app');


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
  const algo = config.gateway().token_hmac_algorithm;
  const seed = config.auth_proxy().session.secret;

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
