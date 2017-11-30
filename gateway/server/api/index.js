const { app } = require('../app');


/**
 * Implement a besic health check.
 */
app.get('/api/health', (req, res) => {
  res.json({});
});


// Import routes.
require('./auth');
require('./proxied');
