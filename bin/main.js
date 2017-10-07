#!/usr/bin/env node
const minimist = require('minimist');

const configuration = require('../gateway/configuration');
const {
  DEFAULT_CONF_FILE
} = require('../gateway/constants');


// Map all known commands.
const COMMANDS = {
  'list-domains':
    require('../gateway/commands/list-domains').ListDomainsCommand,
  'run': require('../gateway/commands/run').RunCommand,
  'version': require('../gateway/commands/version').VersionCommand
};


// Parse root options.
const root = minimist(process.argv.slice(2), {
  stopEarly: true,  // Allow for nested commands.
  boolean: ['version'],
  string: ['config']
});


// Load configuration.
const config = configuration.load(root.config);


// Find the correct command class.
let cmd = root._[0];
if (root.version) {
  cmd = 'version';
}
if (!cmd) {
  throw Error('No command specified');
}

// Lookup and run the command.
const Command = COMMANDS[cmd];
if (!Command) {
  throw Error('Unable to find command "' + cmd + '"');
}
const command = new Command(root, config);
command.run();
