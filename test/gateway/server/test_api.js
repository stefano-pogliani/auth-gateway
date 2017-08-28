const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const mockApp = {
  get: sinon.spy()
};
const mockUtils = {
  getCookieSession: sinon.spy()
};
proxyquire('../../../gateway/server/api', {
  './app': {
    app: mockApp,
    logAppMessage: sinon.spy()
  },
  './utils': mockUtils
});


describe('Server', () => {
  describe('app', () => {
    afterEach(() => {
      mockUtils.getCookieSession.reset()
    });

    describe('/api/auth', () => {
      it('Sends a 202 when allowed', () => {
        const endpoint = mockApp.get.getCall(0).args[1];
        const req = {
          get: sinon.stub().returns('ABC')
        };
        const res = {
          end: sinon.spy(),
          status: sinon.stub()
        }
        res.status.returns(res);
        endpoint(req, res);
        const callback = mockUtils.getCookieSession.getCall(0).args[2];
        callback({
          allowed: true,
          email: 'a@b.c',
          gravatar: 'acb',
          user: 'a'
        });
        assert(res.status.calledWith(202));
        assert(res.end.calledWith());
      });

      it('Sends a 401 when not allowed', () => {
        const endpoint = mockApp.get.getCall(0).args[1];
        const req = {
          get: sinon.stub().returns('ABC')
        };
        const res = {
          end: sinon.spy(),
          status: sinon.stub()
        }
        res.status.returns(res);
        endpoint(req, res);
        const callback = mockUtils.getCookieSession.getCall(0).args[2];
        callback({
          allowed: false,
          email: null,
          gravatar: null,
          user: null
        });
        assert(res.status.calledWith(401));
        assert(res.end.calledWith());
      });
    });

    describe('/api/health', () => {
      it('returns json', () => {
        const endpoint = mockApp.get.getCall(1).args[1];
        const res = {
          json: sinon.spy()
        };
        endpoint(null, res);
        assert(res.json.calledWith({}));
      });
    });

    describe('/api/proxied/session', () => {
      it('returns no user', () => {
        const endpoint = mockApp.get.getCall(2).args[1];
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
        const endpoint = mockApp.get.getCall(2).args[1];
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

