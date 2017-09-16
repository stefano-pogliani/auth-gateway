const promclient = require('prom-client');
const collectDefaultMetrics = promclient.collectDefaultMetrics;

const { app, logAppMessage } = require('./app');
const { shutdown } = require('../shutdown');


// Import routes and views.
require('./api');
require('./views');

// Import the error handler last to catch all exceptions.
require('./handle_errors');


const RunWebServer = (config) => {
  const gateway = config.gateway;
  const address = gateway.bind.address;
  const port = gateway.bind.port;
  app.set('config', config);
  collectDefaultMetrics();

  /*
   * If the server fails to start any of the processes before the
   * web server manages to start listening we do not close properly.
   * If we call the listen callback *after* we already received
   * the stop signal we stop ourselves.
   */
  let process_stopping = false;

  // Start the HTTP server.
  const ready = `AuthGateway server running at http://${address}:${port}`;
  const server = app.listen(port, address, () => {
    if (process_stopping) {
      logAppMessage('Received stop before server started');
      logAppMessage('Stopping AuthGateway server');
      server.close();
      return;
    }
    logAppMessage(ready)
  });

  // Stop server on shutdown.
  shutdown.once('stop', () => {
    logAppMessage('Stopping AuthGateway server');
    server.close();
    process_stopping = true;
  });
};
module.exports.RunWebServer = RunWebServer;
