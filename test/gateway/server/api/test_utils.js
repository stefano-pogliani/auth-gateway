const assert = require('assert');
const sinon = require('sinon');
require('prom-client').register.clear();

const Auditor = require('../../../../gateway/server/auditor');
const { AuditedResponse } = require('../../../../gateway/server/api/utils');
const { Config } = require('../../../../gateway/configuration');


const TEST_CONFIG = new Config({
  auditor: {provider: 'test'}
});


describe('Server', () => {
  describe('API Utils', () => {
    describe('AuditedResponse', () => {
      afterEach(() => {
        this.clock.restore();
        Auditor.Reset();
      });
      beforeEach(() => {
        Auditor.InitialiseAuditor(TEST_CONFIG);
        this.clock = sinon.useFakeTimers();
      });

      it('Audits the request', () => {
        const audit_event = {
          email: 'test@example.com',
          protocol: "https",
          reason: "Session not valid",
          resource: "ABC://ABCABC",
          result: "deny",
          session_id: '123',
          timestamp: 0,
          user: 'Me',
          whitelisted: false
        };
        const result = {allowed: true};
        return AuditedResponse(audit_event, result).then((code) => {
          const audit = Auditor.Instance().audit;
          assert.deepEqual(audit.getCall(0).args[0], audit_event);
          assert.equal(202, code);
        });
      });

      it('Generates a 202 when allowed', () => {
        const audit_event = {};
        const result = {allowed: true};
        return AuditedResponse(audit_event, result).then((code) => {
          assert.equal(202, code);
        });
      });

      it('Generates a 401 when not allowed', () => {
        const audit_event = {};
        const result = {allowed: false};
        return AuditedResponse(audit_event, result).then((code) => {
          assert.equal(401, code);
        });
      });

      it('Rejects requests based on auditor', () => {
        const audit_event = {};
        const result = {allowed: true};
        Auditor.Instance().audit.resolves(1234);
        return AuditedResponse(audit_event, result).then((code) => {
          assert.equal(1234, code);
        });
      });
    });
  });
});
