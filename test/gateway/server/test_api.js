const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const mockApp = {
  get: sinon.spy()
};
proxyquire('../../../gateway/server/api', {
  './app': {
    app: mockApp,
    logAppMessage: sinon.spy()
  }
});


describe('Server', () => {
  describe('app', () => {
    describe('/api/health', () => {
      it('returns json', () => {
        const endpoint = mockApp.get.getCall(0).args[1];
        const res = {
          json: sinon.spy()
        };
        endpoint(sinon.spy(), res);
        assert(res.json.calledWith({}));
      });
    });
  });
});

