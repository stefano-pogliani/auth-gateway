const assert = require('assert');

const { NullAuditor } = require('../../../../gateway/server/auditor/null');


describe('Server', () => {
  describe('Auditor', () => {
    describe('Null', () => {
      it('returns null', () => {
        const auditor = new NullAuditor({});
        return auditor.audit().then((result) => {
          assert.equal(null, result);
        });
      });
    });
  });
});
