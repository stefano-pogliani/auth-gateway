const { app } = require('./app');


/**
 * Implement a besic health check.
 */
app.get('/api/health', function (req, res) {
  res.json({});
});
