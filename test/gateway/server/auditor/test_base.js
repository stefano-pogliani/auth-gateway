const assert = require('assert');

const { Auditor } = require('../../../../gateway/server/auditor/base');


describe('Server', () => {
  describe('Auditor', () => {
    describe('Base', () => {
      it('throws', () => {
        const auditor = new Auditor({});
        return auditor.audit().then(
          () => assert.fail('Promise did not throw'),
          () => assert.ok(true, 'Promise failed as expected')
        );
      });
    });
  });
});
