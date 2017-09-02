const assert = require('assert');

const { NullAuditor } = require('../../../../gateway/server/auditor/null');


describe('Server', () => {
  describe('Auditor', () => {
    describe('Null', () => {
      it('returns null', () => {
        const auditor = new NullAuditor({});
        const result = auditor.audit();
        assert.equal(null, result);
      });
    });
  });
});
