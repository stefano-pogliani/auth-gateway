const { app } = require('../app');
const { enhanceApp } = require('../../configuration');
const { getCookieSession } = require('../utils');


/**
 * Returns the portal home page.
 */
app.get('/', (req, res) => {
  let config = app.get('config');
  return getCookieSession(req, config).then((session) => {
    let context = {
      apps: config.apps.map(enhanceApp),
      auth: {
        prefix: config.auth_proxy.prefix
      },
      proxy: {
        domain: config.gateway.domain,
        port: config.http_proxy.bind.port
      },
      session: session
    };
    res.render('index', context);
  });
});


/**
 * Returns the user profile page.
 */
app.get('/profile', (req, res) => {
  let config = app.get('config');
  return getCookieSession(req, config).then((session) => {
    let context = {
      auth: {
        prefix: config.auth_proxy.prefix
      },
      session: session
    };
    res.render('profile', context);
  });
});
