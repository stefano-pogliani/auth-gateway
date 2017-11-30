const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');


const TEST_CONFIG = {
  auditor: {
    provider: 'test'
  },
  gateway: {
    token_hmac_algorithm: 'sha1'
  },
  auth_proxy: {
    session: {
      secret: 'abc'
    }
  }
};

const mockApp = {
  get: sinon.stub().returns(TEST_CONFIG)
};
proxyquire('../../../../gateway/server/api/proxied', {
  '../app': {app: mockApp}
});


describe('Server', () => {
  describe('app', () => {
    describe('/api/proxied/metrics', () => {
      it('sets the content type', () => {
        const endpoint = mockApp.get.getCall(0).args[1];
        const res = {
          set: sinon.spy(),
          end: sinon.spy()
        };
        endpoint(null, res);
        assert(res.set.calledWith(
          'Content-Type',
          'text/plain; version=0.0.4; charset=utf-8'
        ));
      });
    });

    describe('/api/proxied/session', () => {
      it('returns no user', () => {
        const endpoint = mockApp.get.getCall(1).args[1];
        const req = {
          get: sinon.stub().returns(null)
        };
        const res = {
          json: sinon.spy()
        };
        endpoint(req, res);
        const response = res.json.getCall(0).args[0];
        assert.deepEqual(response, {
          allowed: false,
          email: null,
          gravatar: null,
          id: null,
          user: null
        });
      });

      it('returns user data', () => {
        const endpoint = mockApp.get.getCall(1).args[1];
        const req = {
          get: sinon.stub().returns('test@localhost')
        };
        const res = {
          json: sinon.spy()
        };
        endpoint(req, res);
        const response = res.json.getCall(0).args[0];
        assert.deepEqual(response, {
          allowed: true,
          email: 'test@localhost',
          gravatar: '8ea890a677d6a223c591a1beea6ea9d2',
          id: 'V5wWNz/QByMqHk6z55/ZCzoNvb8=',
          user: 'test@localhost'
        });
      });
    });
  });
});
