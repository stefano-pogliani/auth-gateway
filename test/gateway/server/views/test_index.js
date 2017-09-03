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
    describe('views', () => {
      afterEach(() => {
        mockUtils.getCookieSession.reset();
      });

      const getRender = () => {
        return mockUtils.getCookieSession.getCall(0).args[2];
      };

      const simulateGet = (index) => {
        const endpoint = mockApp.get.getCall(index).args[1];
        const res = {
          render: sinon.spy()
        };
        mockApp.get.returns(TEST_CONFIG);
        return {
          makeRequest: () => endpoint(TEST_REQ, res),
          res: res
        }
      };

      it('render index', () => {
        const { makeRequest, res } = simulateGet(0);
        mockUtils.getCookieSession.resolves({
          allowed: false,
          email: null,
          gravatar: null,
          user: null
        });
        return makeRequest().then(() => {
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
      });

      it('render profile', () => {
        const { makeRequest, res } = simulateGet(1);
        mockUtils.getCookieSession.resolves({
          allowed: false,
          email: null,
          gravatar: null,
          user: null
        });
        return makeRequest().then(() => {
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
});
