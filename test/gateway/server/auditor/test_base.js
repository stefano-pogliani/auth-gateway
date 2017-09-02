const assert = require('assert');

const { Auditor } = require('../../../../gateway/server/auditor/base');


describe('Server', () => {
  describe('Auditor', () => {
    describe('Base', () => {
      it('throws', () => {
        const auditor = new Auditor({});
        assert.throws(auditor.audit, Error);
      });
    });
  });
});
