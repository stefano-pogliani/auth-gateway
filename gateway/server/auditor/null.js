const { Auditor } = require('./base');


class NullAuditor extends Auditor {
  audit() {
    return Promise.resolve(null);
  }
};
module.exports.NullAuditor = NullAuditor;
