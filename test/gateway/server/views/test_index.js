const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const mockApp = {
  get: sinon.spy()
};
proxyquire('../../../../gateway/server/views', {
  '../app': {
    app: mockApp,
    logAppMessage: sinon.spy()
  }
});


describe('Server', () => {
  describe('app', () => {
    describe('/', () => {
      it('renders index', () => {
        const endpoint = mockApp.get.getCall(0).args[1];
        const res = {
          render: sinon.spy()
        };
        endpoint(sinon.spy(), res);
        assert(res.render.calledWith('index', {}));
      });
    });
  });
});


