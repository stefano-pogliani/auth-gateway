const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
require('prom-client').register.clear();

const mockExpress = {
  set: sinon.spy(),
  use: sinon.spy()
};
const {
  app,
  countRequests,
  logAppMessage
} = proxyquire('../../../gateway/server/app', {
  express: () => mockExpress
});


describe('Server', () => {
  describe('logAppMessage', () => {
    afterEach(() => {
      this.spyLog.restore();
    });
    beforeEach(() => {
      this.spyLog = sinon.spy(console, 'log');
    });

    it('prints the given message and tag', () => {
      logAppMessage('abc');
      assert.equal(
        '\u001b[32m[-app-]\u001b[39m abc',
        this.spyLog.getCall(0).args[0]
      );
    });
  });

  describe('countRequests', () => {
    it('call next', () => {
      const next = sinon.spy();
      const res = {on: sinon.spy()};
      countRequests(null, res, next);
      assert(next.calledWith());
    });
  });
});
