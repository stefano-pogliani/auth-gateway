/**
 * Returns an authorization result based on the session.
 *
 * This check is for requests to protected resources
 * so the session must be valid.
 */
module.exports.CheckProtectedRequest = (session) => {
  const allowed = session.allowed;
  return {
    allowed: allowed,
    reason: allowed ? 'Found valid session' : 'Session not valid',
    whitelisted: false
  };
};
