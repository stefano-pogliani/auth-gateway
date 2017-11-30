const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
require('prom-client').register.clear();

const Auditor = require('../../../gateway/server/auditor');


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
const mockUtils = {
  getSession: sinon.stub()
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
      this.clock.restore();
      mockUtils.getSession.reset()
      Auditor.Reset();
    });
    beforeEach(() => {
      Auditor.InitialiseAuditor(TEST_CONFIG);
      this.clock = sinon.useFakeTimers();
    });

    describe('/api/auth', () => {
      const simulateGet = () => {
        const endpoint = mockApp.get.getCall(0).args[1];
        const req = {
          get: sinon.stub().returns('ABC')
        };
        const res = {
          end: sinon.spy(),
          status: sinon.stub()
        };
        res.status.returns(res);
        return {
          makeRequest: () => endpoint(req, res),
          req: req,
          res: res
        };
      };

      it('Sends a 202 when allowed', () => {
        const { makeRequest, res } = simulateGet();
        mockUtils.getSession.resolves({
          allowed: true,
          email: 'a@b.c',
          gravatar: 'acb',
          id: '123',
          user: 'a'
        });
        return makeRequest().then(() => {
          assert(res.status.calledWith(202));
          assert(res.end.calledWith());
        });
      });

      it('Sends a 401 when not allowed', () => {
        const { makeRequest, res } = simulateGet();
        mockUtils.getSession.resolves({
          allowed: false,
          email: null,
          gravatar: null,
          id: null,
          user: null
        });
        return makeRequest().then(() => {
          assert(res.status.calledWith(401));
          assert(res.end.calledWith());
        });
      });

      it('audits the request', () => {
        const { makeRequest } = simulateGet();
        mockUtils.getSession.resolves({
          allowed: false,
          email: 'test@example.com',
          gravatar: null,
          id: '123',
          user: 'Me'
        });
        return makeRequest().then(() => {
          const audit = Auditor.Instance().audit;
          assert.deepEqual(audit.getCall(0).args[0], {
            email: 'test@example.com',
            protocol: "https",
            resource: "ABC://ABCABC",
            result: "deny",
            session_id: '123',
            timestamp: 0,
            user: 'Me'
          });
        });
      });

      it('auditor rejects the request', () => {
        const { makeRequest, res } = simulateGet();
        Auditor.Instance().audit.resolves(1234);
        mockUtils.getSession.resolves({
          allowed: false,
          email: 'test@example.com',
          gravatar: null,
          id: '123',
          user: 'Me'
        });
        return makeRequest().then(() => {
          assert(res.status.calledWith(1234));
          assert(res.end.calledWith());
        });
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

    describe('/api/proxied/metrics', () => {
      it('sets the content type', () => {
        const endpoint = mockApp.get.getCall(2).args[1];
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
        const endpoint = mockApp.get.getCall(3).args[1];
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
        const endpoint = mockApp.get.getCall(3).args[1];
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
