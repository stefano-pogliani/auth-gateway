const { Auditor } = require('./base');
const { logAppMessage } = require('../app');


class ConsoleAuditor extends Auditor {
  audit(event) {
    const message = `Request audit: ${JSON.stringify(event)}`;
    logAppMessage(message);
    return null;
  }
};
module.exports.ConsoleAuditor = ConsoleAuditor;
