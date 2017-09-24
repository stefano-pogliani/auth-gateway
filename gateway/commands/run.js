const process = require('process');
const tmp = require('tmp');

const Auditor = require('../server/auditor');
const { logAppMessage } = require('../server/app');
const { shutdown } = require('../shutdown');
const { Command } = require('./base');
const { RunWebServer } = require('../server');
const {
  AuthProxy,
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
    process.on('SIGHUP',  () => this._handleReload());
    Auditor.InitialiseAuditor(this._config);
    InitialiseSubProcs(this._config);
    this.auth_proxy = AuthProxy();
    this.http_proxy = HttpProxy();
  }

  /**
   * Handle SIGHUP to reload and logrotate subprocesses.
   */
  _handleReload() {
    logAppMessage('Reloading and logrotating subprocesses ...');
    this.auth_proxy.reload();
    this.auth_proxy.logrotate();
    const reloaded = this.http_proxy.reload();
    if (!reloaded) {
      throw new Error('HTTP Proxy must support reloading');
    }
    this.http_proxy.logrotate();
    logAppMessage('Subprocesses signaled');
  }

  /**
   * Starts the (auth and http) proxy servers.
   */
  _spawnProxies() {
    this.auth_proxy.spawn();
    this.http_proxy.spawn();
  }

  /**
   * Run the AuthGateway services and API.
   */
  run() {
    this._initialiseServer();
    this._spawnProxies();
    RunWebServer(this._config);
  }
};
module.exports.RunCommand = RunCommand;
