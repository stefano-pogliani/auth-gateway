/**
 * Abstract auditor class.
 */
class Auditor {
  constructor(conf) {
    this.conf = conf;
  }

  audit() {
    throw Error('Not Implemented');
  }
};
module.exports.Auditor = Auditor;
