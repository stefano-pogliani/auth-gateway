const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const mockApp = {
  get: sinon.stub()
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
      afterEach(() => {
        mockApp.get.reset();
      });

      it('renders index', () => {
        const endpoint = mockApp.get.getCall(0).args[1];
        const config = {
          auth_proxy: {prefix: '/abc'}
        };
        const res = {
          render: sinon.spy()
        };
        mockApp.get.returns(config);
        endpoint(sinon.spy(), res);
        assert(res.render.calledWith('index', {
          auth: {prefix: '/abc'},
          session: {
            allowed: false,
            email: null,
            gravatar: null,
            user: null
          }
        }));
      });
    });
  });
});


