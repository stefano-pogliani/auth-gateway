const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

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
      this.clock.restore();
      mockUtils.getCookieSession.reset()
      Auditor.Reset();
    });
    beforeEach(() => {
      Auditor.InitialiseAuditor(TEST_CONFIG);
      this.clock = sinon.useFakeTimers();
    });

    describe('/api/auth', () => {
      const get_callback = () => {
        const endpoint = mockApp.get.getCall(0).args[1];
        const req = {
          get: sinon.stub().returns('ABC')
        };
        const res = {
          end: sinon.spy(),
          status: sinon.stub()
        };
        res.status.returns(res);
        endpoint(req, res);
        return {
          callback: mockUtils.getCookieSession.getCall(0).args[2],
          req: req,
          res: res
        };
      };

      it('Sends a 202 when allowed', () => {
        const { callback, res } = get_callback();
        return callback({
          allowed: true,
          email: 'a@b.c',
          gravatar: 'acb',
          id: '123',
          user: 'a'
        }).then(() => {
          assert(res.status.calledWith(202));
          assert(res.end.calledWith());
        });
      });

      it('Sends a 401 when not allowed', () => {
        const { callback, res } = get_callback();
        return callback({
          allowed: false,
          email: null,
          gravatar: null,
          id: null,
          user: null
        }).then(() => {
          assert(res.status.calledWith(401));
          assert(res.end.calledWith());
        });
      });

      it('audits the request', () => {
        const { callback } = get_callback();
        return callback({
          allowed: false,
          email: 'test@example.com',
          gravatar: null,
          id: '123',
          user: 'Me'
        }).then(() => {
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
        const audit = Auditor.Instance().audit;
        const { callback, res } = get_callback();
        audit.resolves(1234);
        return callback({
          allowed: false,
          email: 'test@example.com',
          gravatar: null,
          id: '123',
          user: 'Me'
        }).then(() => {
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
          id: null,
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
          id: "579c16373fd007232a1e4eb3e79fd90b3a0dbdbf",
          user: "test@localhost"
        });
      });
    });
  });
});
