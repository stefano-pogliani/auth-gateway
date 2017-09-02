const { Auditor } = require('./base');


class TestAuditor extends Auditor {
  constructor(conf) {
    super(conf);
    const sinon = require('sinon');
    this.audit = sinon.stub();
  }
};
module.exports.TestAuditor = TestAuditor;
