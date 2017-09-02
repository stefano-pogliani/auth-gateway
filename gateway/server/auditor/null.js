const { Auditor } = require('./base');


class NullAuditor extends Auditor {
  audit() {
    return null;
  }
};
module.exports.NullAuditor = NullAuditor;
