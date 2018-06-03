/**
 * Returns an audit result.
 *
 * This check is for requests to audited resources
 * so the state of the session is ignored.
 */
module.exports.CheckAuditedRequest = (_) => {
  return {
    allowed: true,
    reason: 'This is an audited request',
    whitelisted: true
  };
};

/**
 * Returns an authorization result based on the session.
 *
 * This check is for requests to protected resources
 * so the session must be valid.
 */
module.exports.CheckProtectedRequest = (session, req, config) => {
  let check = {
    allowed: session.allowed,
    reason: session.allowed ? 'Found valid session' : 'Session not valid',
    whitelisted: false
  };

  // Allow whitelisted paths even if session is rejected.
  if (!check.allowed && req.headers.host) {
    const host = req.headers.host;
    const app = config.appForHost(host);
    if (!app) {
      check.reason = 'Session not valid for unrecognised app';
      return check;
    }

    // Check whitelisted paths for the first match.
    const request_uri = req.headers['x-original-uri'];
    const whitelist = app.upstream.whitelist;
    const match = whitelist.find((pattern) => {
      const re = new RegExp(pattern);
      return re.test(request_uri);
    });
    if (match) {
      check.allowed = true;
      check.reason = `Path allowed by whitelist: '${match}'`;
      check.whitelisted = true;
    }
  }
  return check;
};
