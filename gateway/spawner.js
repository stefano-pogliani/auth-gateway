const child_process = require('child_process');
const process = require('process');
const fs = require('fs');
const tmp = require('tmp');

const { shutdown } = require('./shutdown');


/**
 * Wrapper around the child_process.spawn function to provide
 * additional functionality and standardize common use cases.
 *
 * Provides:
 *
 *   * Decorate and pipe stdout and stderr streams.
 *   * Gracefully terminate the process (terminate after timeout).
 *   * React to child termination (default to exit).
 *   * Reload configuration through signals.
 *   * Stop subprocess as the system shuts down.
 *   * Support for dynamic config files.
 */
class Spawner {
  /**
   * @param {string} name The name of the child to spawn.
   * @param {string} command The command to execute.
   * @param {object} options Optional configuration settings.
   */
  constructor(name, command, options) {
    options = options || {};
    this._args = options.args || [];
    this._command = command;
    this._makeConfig = options.makeConfig || null;
    this._name = name;
    this._output = options.output || console.log;
    this._tagLine = options.tagLine || ((msg) => msg);
    this._tagInformLine = options.tagInformLine || this._tagLine;

    this._signals = {
      logrotate: options.logrotateSignal || null,
      reload: options.reloadSignal || null,
      stop: options.stopSignal || 'SIGINT'
    };

    // Store the ChildProcess instance spawned for this instance.
    this._proc = null;

    // Store the temportary file storing the configuration.
    this._tmpFile = null;

    // Buffers for output streaming.
    this._bufferStderr = '';
    this._bufferStdout = '';

    // Track the callback for shutdown stop so we can remove it on exit.
    this._onSystemStop = () => {
      this._proc.kill(this._signals.stop);
    };

    // Add the config option arguments.
    if (this._makeConfig) {
      const configFlag = options.configFlag || null;
      this._tmpFile = tmp.fileSync({
        prefix: 'authgateway-',
        postfix: '.' + name
      });
      if (configFlag) {
        this._args.push(configFlag);
      }
      this._args.push(this._tmpFile.name);
    }
  }

  /**
   * Flushes the stderr and stdout buffers
   * if anything is in them.
   */
  _flushOutput() {
    const me = this._tagLine(this.name());
    if (this._bufferStderr) {
      let line = this._bufferStderr;
      let message = `${me}${line}`;
      this._output(message);
    }
    if (this._bufferStdout) {
      let line = this._bufferStdout;
      let message = `${me}${line}`;
      this._output(message);
    }
  }

  /**
   * Output a message that relates to the spawned process
   * but that comes from AuthGateway.
   */
  _inform(message) {
    const me = this._tagInformLine(this.name());
    this._output(`${me}${message}`);
  }

  /**
   * Binds the spawner instance with the error
   * and exit events on the child process.
   */
  _listenExit() {
    this._proc.on('error', (err) => {
      this._onError(err);
    });
    this._proc.on('exit', (code, signal) => {
      this._onExit(code, signal);
    });
  }

  /**
   * Binds the spawner instance with the stdout
   * and stderr data events on the child process.
   */
  _listenStream() {
    this._proc.stderr.on('data', (chunk) => {
      this._onOutput(chunk, true);
    });
    this._proc.stdout.on('data', (chunk) => {
      this._onOutput(chunk, false);
    });
  }

  _onError(err) {
    this._flushOutput();
    let error = err.toString();
    let message = `Child emitted an error: ${error}`;
    this._inform(message);

    // Don't kill dead process on system stop and start shutdown.
    shutdown.removeListener('stop', this._onSystemStop);
    shutdown.childExited(-1);
  }

  _onExit(code, signal) {
    this._flushOutput();
    let reason = '';
    if (signal) {
      reason = ` because of ${signal}`;
    }
    let message = `Exited with code ${code}${reason}`;
    this._inform(message);

    // Don't kill dead process on system stop and start shutdown.
    shutdown.removeListener('stop', this._onSystemStop);
    shutdown.childExited(code);
  }

  _onOutput(chunk, stderr) {
    // Fetch the current content of the buffers.
    let buffer = stderr ? this._bufferStderr : this._bufferStdout;
    buffer = buffer + chunk.toString();

    // Split buffer into lines and output as much as possible.
    // Store whatever is left for later.
    let lines = buffer.split(/\r?\n/);
    const me = this._tagLine(this.name());
    buffer = lines.pop();
    lines.forEach((line) => {
      let message = `${me}${line}`;
      this._output(message);
    });

    // Store leftovers back in the buffer.
    if (stderr) {
      this._bufferStderr = buffer;
    } else {
      this._bufferStdout = buffer;
    }
  }

  /**
   * Renders the configuration content and writes it to disk.
   */
  _renderConfig() {
    if (!this._makeConfig) {
      return;
    }
    const config = this._makeConfig();
    fs.writeFileSync(this._tmpFile.name, config);
    this._inform(`Rendered configuration file at ${this._tmpFile.name}`);
  }

  /**
   * Signals the child process with the _signals.logrotate.
   * Does nothing if the signal is not set.
   * @returns {bool} True if the child was signalled.
   */
  logrotate() {
    if (this._signals.logrotate) {
      this._proc.kill(this._signals.logrotate);
      return true;
    }
    return false;
  }

  /**
   * @returns {string} The name of the child to spawn.
   */
  name() {
    return this._name;
  }

  /**
   * Signals the child process with the _signals.reload.
   * Does nothing if the signal is not set.
   * @returns {bool} True if the child was signalled.
   */
  reload() {
    if (this._signals.reload) {
      this._proc.kill(this._signals.reload);
      return true;
    }
    return false;
  }

  /**
   * Starts the child process and returns.
   * A configuration file is rendered if needed.
   */
  spawn() {
    if (this._proc) {
      throw new Error('Cannot spawn a process more then once!');
    }
    this._renderConfig();
    this._proc = child_process.spawn(this._command, this._args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    // TODO: add this? If so fix tests.
    // this._inform(`Spawned ${this._command} ${this._args.join(' ')}`);
    this._listenExit();
    this._listenStream();

    // Stop child on process exit.
    shutdown.once('stop', this._onSystemStop);
  }
};
module.exports.Spawner = Spawner;
