const assert = require('assert');
const deepmerge = require('deepmerge');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const mockJar = {setCookie: sinon.spy()};
const mockRequest = sinon.spy();
mockRequest.jar = sinon.stub().returns(mockJar);
mockRequest.cookie = sinon.spy();

const { getCookieSession } = proxyquire('../../../gateway/server/utils', {
  request: mockRequest
});

const NULL_SESSION = {
  allow: false,
  email: null,
  gravatar: null,
  id: null,
  user: null
};
const TEST_CONFIG = {
  auth_proxy: {
    bind: {
      address: '*',
      port: 1234
    },
    session: {
      name: 'authgateway'
    }
  }
};
const TEST_REQ = {
  cookies: {authgateway: 'abcd'}
};
const TEST_SESSION = {
  allow: true,
  email: 'abc',
  gravatar: 'def',
  id: 'ghi',
  user: 'jkl'
};


describe('Server', () => {
  describe('Utils', () => {
    describe('getCookieSession', () => {
      afterEach(() => {
        mockRequest.reset();
        mockRequest.cookie.reset();
        mockJar.setCookie.reset();
      });

      it('Calls out to localhost', () => {
        const callback = sinon.spy();
        getCookieSession(TEST_REQ, TEST_CONFIG, callback);
        const options = mockRequest.getCall(0).args[0];
        assert.deepEqual(options, {
          url: 'http://localhost:1234/api/proxied/session',
          jar: mockJar
        });
      });

      it('Calls out to ip', () => {
        const callback = sinon.spy();
        const conf = deepmerge(TEST_CONFIG, {
          auth_proxy: {
            bind: {address: '1.2.3.4'}
          }
        });
        getCookieSession(TEST_REQ, conf, callback);
        const options = mockRequest.getCall(0).args[0];
        assert.deepEqual(options, {
          url: 'http://1.2.3.4:1234/api/proxied/session',
          jar: mockJar
        });
      });

      it('Returns default on error', () => {
        const callback = sinon.spy();
        getCookieSession(TEST_REQ, TEST_CONFIG, callback);
        const handler = mockRequest.getCall(0).args[1];
        handler('123', null, null);
        assert.deepEqual(NULL_SESSION, callback.getCall(0).args[0]);
      });

      it('Returns default on !2xx response', () => {
        const callback = sinon.spy();
        getCookieSession(TEST_REQ, TEST_CONFIG, callback);
        const handler = mockRequest.getCall(0).args[1];
        const response = {
          statusCode: 300
        };
        handler(null, response, null);
        assert.deepEqual(NULL_SESSION, callback.getCall(0).args[0]);
      });

      it('Returns default on JSON decode error', () => {
        const callback = sinon.spy();
        getCookieSession(TEST_REQ, TEST_CONFIG, callback);
        const handler = mockRequest.getCall(0).args[1];
        const response = {statusCode: 200};
        handler(null, response, 'noop');
        assert.deepEqual(NULL_SESSION, callback.getCall(0).args[0]);
      });

      it('Returns upstream session', () => {
        const callback = sinon.spy();
        getCookieSession(TEST_REQ, TEST_CONFIG, callback);
        const handler = mockRequest.getCall(0).args[1];
        const response = {statusCode: 201};
        handler(null, response, JSON.stringify(TEST_SESSION));
        assert.deepEqual(TEST_SESSION, callback.getCall(0).args[0]);
      });
    });
  });
});
