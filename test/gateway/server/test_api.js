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
        endpoint(null, res);
        assert(res.json.calledWith({}));
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
          email: "test@localhost",
          gravatar: "8ea890a677d6a223c591a1beea6ea9d2",
          user: "test@localhost"
        });
      });
    });
  });
});

