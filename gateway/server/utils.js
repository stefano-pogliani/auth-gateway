const request = require('request');
const NULL_SESSION = {
  allow: false,
  email: null,
  gravatar: null,
  user: null
};


/**
 * Returns session information by calling the session endpoint.
 *
 * If the proxied session endpoint returns an error assume the
 * session is invalid and return a null one.
 */
module.exports.getCookieSession = (req, config, callback) => {
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
  request(options, (err, response, response_content) => {
    if (err || response.statusCode < 200 || response.statusCode >= 300) {
      callback(NULL_SESSION);
      return;
    }
    try {
      callback(JSON.parse(response_content));
    } catch(e) {
      callback(NULL_SESSION);
    }
  });
}
