const EventEmitter = require('events');
const process = require('process');
const colors = require('colors');


class ShutdownManager extends EventEmitter {
  constructor() {
    super();
    this._signalled = false;
    this._stopping = false;
  }

  childExited(code) {
    if (this._stopping) {
      return;
    }
    this._stopping = true;
    process.exitCode = code;
    this.emit('stop');
  }

  stop() {
    // First start a gracefull shutdown.
    if (!this._signalled) {
      this._signalled = true;
      console.log(colors.yellow(
        'Stopping gracefully, signal again to force exit'
      ));

      // But don't emit the event if a client stopping has already done so.
      if (!this._stopping) {
        this._stopping = true;
        this.emit('stop');
      }
      return;
    }
    console.log(colors.red(
      'Stopping abrubptly now, sorry you had to do that!'
    ));
    if (process.exitCode === 0) {
      process.exitCode = 1;
    }
    process.exit();
  }
};
module.exports.ShutdownManager = ShutdownManager;

/**
 * The singleton shutdown instance for all the system.
 */
module.exports.shutdown = new ShutdownManager();
