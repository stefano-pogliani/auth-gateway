const { app } = require('../app');
const { getCookieSession } = require('../utils');


/**
 * Returns the portal home page.
 */
app.get('/', (req, res) => {
  let config = app.get('config');
  getCookieSession(req, config, (session) => {
    let context = {
      auth: {
        prefix: config.auth_proxy.prefix
      },
      session: session
    };
    res.render('index', context);
  });
});
