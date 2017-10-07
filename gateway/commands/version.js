const { Command } = require('./base');
const { version } = require('../../package');


/**
 * Print the version and exit.
 */
class VersionCommand extends Command {
  run() {
    console.log('AuthGateway version: %s', version);
  }
};
module.exports.VersionCommand = VersionCommand;
