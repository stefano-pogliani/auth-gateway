const tmp = require('tmp');

const { shutdown } = require('../shutdown');
const { Command } = require('./base');
const {
  InitialiseSubProcs,
  HttpProxy
} = require('../subprocs');


/**
 * Command to run the AuthGateway proxies and APIs.
 */
class RunCommand extends Command {
  constructor(args, config) {
    super(args, config);
    this.auth_proxy = null;
    this.http_proxy = null;
  }

  /**
   * Initialise the AuthGateway server.
   */
  _initialiseServer() {
    tmp.setGracefulCleanup();
    process.on('SIGINT',  () => shutdown.stop());
    process.on('SIGTERM', () => shutdown.stop());
    InitialiseSubProcs(this._config);
    this.http_proxy = HttpProxy();
  }

  /**
   * Starts the (auth and http) proxy servers.
   */
  _spawnProxies() {
    this.http_proxy.spawn();
  }

  /**
   * Run the AuthGateway services and API.
   */
  run() {
    this._initialiseServer();
    this._spawnProxies();
  }
};
module.exports.RunCommand = RunCommand;
