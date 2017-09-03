const request = require('request');
const NULL_SESSION = {
  allow: false,
  email: null,
  gravatar: null,
  id: null,
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
        resolve(JSON.parse(content));
      } catch(e) {
        resolve(NULL_SESSION);
      }
    });
  });
}
