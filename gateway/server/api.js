const md5 = require('md5');
const { app } = require('./app');


/**
 * Verify a request received by the HTTP Poxy for authorization.
 *
 * Return codes:
 *   - 202: The request is allowed.
 *   - 401: The request is NOT allowed.
 */
app.get('/api/auth', (req, res) => {
  const host = req.get('Host');
  const proto = req.get('X-Forwarded-Proto');
  const uri = req.get('X-Original-URI');
  const original_url = `${proto}://${host}${uri}`;
  console.log(`Intercepted request: ${original_url}`);
  res.status(202).end();
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
 *   "user": "abc"
 * }
 * ```
 */
app.get('/api/proxied/session', (req, res) => {
  let email = req.get('X-Forwarded-Email');
  let user = req.get('X-Forwarded-User');
  let session = {
    allowed: !!user,
    email: email || null,
    gravatar: null,
    user: user || null
  };
  if (email) {
    session.gravatar = md5(email.trim().toLowerCase());
  }
  res.json(session);
});
