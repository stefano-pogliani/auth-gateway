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


const TEST_CONFIG = {
  gateway: {
    domain: 'example.com',
  },
  auth_proxy: {
    prefix: '/abc',
    bind: {
      address: 'localhost',
      port: 8081
    }
  },
  http_proxy: {
    bind: {
      port: 443
    }
  },
  apps: [{
    name: 'test1',
    title: 'Abc',
    url: 'abc'
  }, {
    name: 'test2',
    upstream: {
      host: 'host:port',
      protocol: 'https'
    }
  }, {
    name: 'test3',
    type: 'upstream',
    upstream: {
      host: 'host:port',
      protocol: 'https',
      subdomain: 'domain'
    }
  }, {
    name: 'test4'
  }]
};
const TEST_REQ = {
  cookies: {authgateway: 'abc'}
};


describe('Server', () => {
  describe('app', () => {
    describe('/', () => {
      afterEach(() => {
        mockUtils.getCookieSession.reset();
      });

      it('renders index', () => {
        const endpoint = mockApp.get.getCall(0).args[1];
        const res = {
          render: sinon.spy()
        };
        mockApp.get.returns(TEST_CONFIG);
        endpoint(TEST_REQ, res);

        const render = mockUtils.getCookieSession.getCall(0).args[2];
        render({
          allowed: false,
          email: null,
          gravatar: null,
          user: null
        });
        res.render.calledWith('index');
        const context = res.render.getCall(0).args[1];
        assert.deepEqual(context, {
          auth: {prefix: '/abc'},
          apps: [{
            name: 'test1',
            title: 'Abc',
            type: 'link',
            url: 'abc'
          }, {
            name: 'test2',
            title: 'test2',
            type: 'upstream',
            upstream: {
              host: 'host:port',
              protocol: 'https',
              subdomain: 'test2'
            }
          }, {
            name: 'test3',
            title: 'test3',
            type: 'upstream',
            upstream: {
              host: 'host:port',
              protocol: 'https',
              subdomain: 'domain'
            }
          }, {
            name: 'test4',
            title: 'test4',
            type: 'unknown'
          }],
          proxy: {
            domain: 'example.com',
            port: 443
          },
          session: {
            allowed: false,
            email: null,
            gravatar: null,
            user: null
          }
        });
      });

      it('renders profile', () => {
        const endpoint = mockApp.get.getCall(1).args[1];
        const res = {
          render: sinon.spy()
        };
        mockApp.get.returns(TEST_CONFIG);
        endpoint(TEST_REQ, res);

        const render = mockUtils.getCookieSession.getCall(0).args[2];
        render({
          allowed: false,
          email: null,
          gravatar: null,
          user: null
        });
        assert(res.render.calledWith('profile', {
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
