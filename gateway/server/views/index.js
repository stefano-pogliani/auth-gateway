const { app } = require('../app');


/**
 * Returns the portal home page.
 */
app.get('/', (req, res) => {
  let config = app.get('config');
  let context = {
    auth: {
      prefix: config.auth_proxy.prefix
    },
    session: {
      allowed: false,
      email: null,
      gravatar: null,
      user: null
    }
  };
  res.render('index', context);
});
