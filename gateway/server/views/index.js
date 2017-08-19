const { app } = require('../app');


/**
 * Returns the portal home page.
 */
app.get('/', (req, res) => {
  res.render('index', {});
});
