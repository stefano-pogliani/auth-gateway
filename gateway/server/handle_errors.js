const { app, logAppMessage } = require('./app');


/**
 * Handle errors now.
 */
app.use(function(err, req, res, next) {
  const error = JSON.stringify({
    error: err.message,
    trace: err.stack
  });
  logAppMessage(`Error processing request: ${error}`);
  res.status(500).json({error: err.message});
});
