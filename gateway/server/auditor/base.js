/**
 * Abstract auditor class.
 */
class Auditor {
  constructor(conf) {
    this.conf = conf;
  }

  audit() {
    return Promise.reject(new Error('Not Implemented'));
  }
};
module.exports.Auditor = Auditor;
