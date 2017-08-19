/**
 * Base class all commands need to extend.
 */
class Command {
  constructor(args, config) {
    this._args = args;
    this._config = config;
  }

  run() {
    throw Error('Command not implemented');
  }
};
module.exports.Command = Command;
