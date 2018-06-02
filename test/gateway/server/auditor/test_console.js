const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const mockLogAppMessage = sinon.spy();
const {
  ConsoleAuditor
} = proxyquire('../../../../gateway/server/auditor/console', {
  '../app': {
    logAppMessage: mockLogAppMessage
  }
});


describe('Server', () => {
  describe('Auditor', () => {
    describe('Console', () => {
      afterEach(() => {
        mockLogAppMessage.resetHistory();
      });

      it('logs the request', () => {
        const auditor = new ConsoleAuditor({});
        return auditor.audit({k: 'v'}).then(() => {
          const actual_msg = mockLogAppMessage.getCall(0).args[0];
          assert('Request audit: {"k": "v"}', actual_msg);
        });
      });

      it('returns null', () => {
        const auditor = new ConsoleAuditor({});
        return auditor.audit({}).then((result) => {
          assert.equal(null, result);
        });
      });
    });
  });
});
