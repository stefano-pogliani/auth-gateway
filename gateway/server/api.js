const md5 = require('md5');
const { app } = require('./app');


/**
 * Implement a besic health check.
 */
app.get('/api/health', function (req, res) {
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
app.get('/api/proxied/session', function (req, res) {
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
