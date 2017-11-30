const request = require('request');
const NULL_SESSION = {
  allow: false,
  email: null,
  gravatar: null,
  id: null,
  type: null,
  user: null
};


/**
 * Returns session information by calling the session endpoint.
 *
 * If the proxied session endpoint returns an error assume the
 * session is invalid and return a null one.
 */
module.exports.getCookieSession = (req, config) => {
  let host = config.auth_proxy.bind.address;
  if (host === '*') {
    host = 'localhost';
  }
  const port = config.auth_proxy.bind.port;
  const url = `http://${host}:${port}/api/proxied/session`;

  const jar = request.jar();
  const cookie_name = config.auth_proxy.session.name;
  const cookie = req.cookies[cookie_name];
  jar.setCookie(request.cookie(`${cookie_name}=${cookie}`), url);

  const options = {
    url: url,
    jar: jar
  };
  return new Promise((resolve) => {
    request(options, (err, res, content) => {
      if (err || res.statusCode < 200 || res.statusCode >= 300) {
        resolve(NULL_SESSION);
        return;
      }
      try {
        let session = JSON.parse(content);
        session.type = 'cookie';
        resolve(session);
      } catch(e) {
        resolve(NULL_SESSION);
      }
    });
  });
}


/**
 * Returns session information by calling the session endpoint.
 *
 * If the proxied session endpoint returns an error assume the
 * session is invalid and return a null one.
 *
 * Detect the best source for session detection:
 *
 *   * Get the session from cookie.
 *   * TODO: Get the session for HTTP Bearer Token.
 */
module.exports.getSession = (req, config) => {
  const cookie_name = config.auth_proxy.session.name;
  const cookie = req.cookies[cookie_name];
  if (cookie) {
    return module.exports.getCookieSession(req, config);
  }

  // Failed to find a valid session.
  return new Promise((resolve) => {
    resolve(NULL_SESSION);
  });
}
