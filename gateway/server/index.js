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

  // Start the HTTP server.
  const ready = `AuthGateway server running at http://${address}:${port}`;
  const server = app.listen(port, address, () => logAppMessage(ready));

  // Stop server on shutdown.
  shutdown.once('stop', () => {
    logAppMessage('Stopping AuthGateway server');
    server.close();
  });
};
module.exports.RunWebServer = RunWebServer;
