const assert = require('assert');
const deepmerge = require('deepmerge');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const { Config } = require('../../../gateway/configuration');

const mockJar = {setCookie: sinon.spy()};
const mockRequest = sinon.spy();
mockRequest.jar = sinon.stub().returns(mockJar);
mockRequest.cookie = sinon.spy();

const {
  getCookieSession,
  getSession
} = proxyquire('../../../gateway/server/utils', {
  request: mockRequest
});

const NULL_SESSION = {
  allow: false,
  email: null,
  gravatar: null,
  id: null,
  type: null,
  user: null
};
const TEST_CONFIG = new Config({
  auth_proxy: {
    bind: {
      address: '*',
      port: 1234
    },
    session: {
      name: 'authgateway'
    }
  }
});
const TEST_REQ = {
  cookies: {authgateway: 'abcd'}
};
const TEST_SESSION = {
  allow: true,
  email: 'abc',
  gravatar: 'def',
  id: 'ghi',
  type: 'cookie',
  user: 'jkl'
};


describe('Server', () => {
  describe('Utils', () => {
    afterEach(() => {
      mockRequest.resetHistory();
    });

    let simulateRequest = (err, code, body) => {;
      const callback = mockRequest.getCall(0).args[1];
      callback(err, {statusCode: code}, body);
    };

    describe('getCookieSession', () => {
      afterEach(() => {
        mockRequest.cookie.resetHistory();
        mockJar.setCookie.resetHistory();
      });

      it('Calls out to localhost', () => {
        const getReq = getCookieSession(TEST_REQ, TEST_CONFIG);
        simulateRequest(null, 200, '{}');
        return getReq.then((session) => {
          const options = mockRequest.getCall(0).args[0];
          assert.deepEqual(options, {
            url: 'http://localhost:1234/api/proxied/session',
            jar: mockJar
          });
        });
      });

      it('Calls out to ip', () => {
        const conf = new Config(deepmerge(TEST_CONFIG._raw, {
          auth_proxy: {
            bind: {address: '1.2.3.4'}
          }
        }));
        const getReq = getCookieSession(TEST_REQ, conf);
        simulateRequest(null, 200, '{}');
        return getReq.then((session) => {
          const options = mockRequest.getCall(0).args[0];
          assert.deepEqual(options, {
            url: 'http://1.2.3.4:1234/api/proxied/session',
            jar: mockJar
          });
        });
      });

      it('Returns default on error', () => {
        const getReq = getCookieSession(TEST_REQ, TEST_CONFIG);
        simulateRequest('123', 500, null);
        return getReq.then((session) => {
          assert.deepEqual(session, NULL_SESSION);
        });
      });

      it('Returns default on !2xx response', () => {
        const getReq = getCookieSession(TEST_REQ, TEST_CONFIG);
        simulateRequest(null, 300, null);
        return getReq.then((session) => {
          assert.deepEqual(session, NULL_SESSION);
        });
      });

      it('Returns default on JSON decode error', () => {
        const getReq = getCookieSession(TEST_REQ, TEST_CONFIG);
        simulateRequest(null, 200, 'noop');
        return getReq.then((session) => {
          assert.deepEqual(session, NULL_SESSION);
        });
      });

      it('Returns upstream session', () => {
        const getReq = getCookieSession(TEST_REQ, TEST_CONFIG);
        simulateRequest(null, 201, JSON.stringify(TEST_SESSION));
        return getReq.then((session) => {
          assert.deepEqual(session, TEST_SESSION);
        });
      });
    });

    describe('getSession', () => {
      it('Calls getCookieSession when cookies are set', () => {
        const getReq = getSession(TEST_REQ, TEST_CONFIG);
        simulateRequest(null, 201, JSON.stringify('test'));
        return getReq.then((session) => {
          assert.deepEqual(session, 'test');
        });
      });

      it('Fails with NULL_SESSION if no method is available', () => {
        const req = {cookies: {}};
        const getReq = getSession(req, TEST_CONFIG);
        return getReq.then((session) => {
          assert.deepEqual(session, NULL_SESSION);
        });
      });
    });
  });
});
