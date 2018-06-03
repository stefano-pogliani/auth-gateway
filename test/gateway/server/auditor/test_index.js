const assert = require('assert');
const sinon = require('sinon');

const Auditor = require('../../../../gateway/server/auditor');
const { Config } = require('../../../../gateway/configuration');


const TEST_CONFIG = new Config({
  auditor: {
    provider: 'test'
  }
});


describe('Server', () => {
  describe('Auditor', () => {
    afterEach(() => {
      Auditor.Reset();
    });

    describe('Singleton', () => {
      it('fails before init', () => {
        assert.throws(Auditor.Instance, Error);
      });

      it('fails when provide is invalid', () => {
        const block = () => Auditor.InitialiseAuditor(new Config({
          auditor: {provider: 'ABC-What-a-name-it-would-be'}
        }));
        assert.throws(block, Error);
      });

      it('returns the same instance', () => {
        Auditor.InitialiseAuditor(TEST_CONFIG);
        const i1 = Auditor.Instance();
        const i2 = Auditor.Instance();
        assert(i1);
        assert.equal(i1, i2);
      });
    });
  });
});
