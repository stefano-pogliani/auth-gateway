const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
require('prom-client').register.clear();

const Auditor = require('../../../../gateway/server/auditor');

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
proxyquire('../../../../gateway/server/api/audit', {
  '../app': {app: mockApp},
  '../utils': mockUtils
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

    describe('/api/audit', () => {
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

      it('Sends a 202 when not allowed', () => {
        const { makeRequest, res } = simulateGet();
        mockUtils.getSession.resolves({
          allowed: false,
          email: null,
          gravatar: null,
          id: null,
          user: null
        });
        return makeRequest().then(() => {
          assert(res.status.calledWith(202));
          assert(res.end.calledWith());
        });
      });
    });
  });
});
