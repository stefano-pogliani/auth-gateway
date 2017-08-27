const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const mockApp = {
  get: sinon.stub()
};
const mockUtils = {
  getCookieSession: sinon.stub()
};
proxyquire('../../../../gateway/server/views', {
  '../app': {
    app: mockApp,
    logAppMessage: sinon.spy()
  },
  '../utils': mockUtils
});


describe('Server', () => {
  describe('app', () => {
    describe('/', () => {
      afterEach(() => {
        mockApp.get.reset();
        mockUtils.getCookieSession.reset();
      });

      it('renders index', () => {
        const endpoint = mockApp.get.getCall(0).args[1];
        const config = {
          auth_proxy: {
            prefix: '/abc',
            bind: {
              address: 'localhost',
              port: 8081
            }
          }
        };
        const req = {
          cookies: {authgateway: 'abc'}
        };
        const res = {
          render: sinon.spy()
        };
        mockApp.get.returns(config);
        endpoint(req, res);

        const render = mockUtils.getCookieSession.getCall(0).args[2];
        render({
          allowed: false,
          email: null,
          gravatar: null,
          user: null
        });
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
