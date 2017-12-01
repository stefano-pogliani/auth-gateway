const assert = require('assert');

const {
  CheckAuditedRequest,
  CheckProtectedRequest
} = require('../../../gateway/server/auth_logic');


describe('Server', () => {
  describe('Auth Logic', () => {
    it('Allows audited requests', () => {
      const session = {allowed: false};
      const result = CheckAuditedRequest(session);
      assert.deepEqual(result, {
        allowed: true,
        reason: 'This is an audited request',
        whitelisted: true
      });
    });

    it('Allows valid sessions', () => {
      const session = {allowed: true};
      const result = CheckProtectedRequest(session);
      assert.deepEqual(result, {
        allowed: true,
        reason: 'Found valid session',
        whitelisted: false
      });
    });

    it('Regects invalid sessions', () => {
      const session = {allowed: false};
      const result = CheckProtectedRequest(session);
      assert.deepEqual(result, {
        allowed: false,
        reason: 'Session not valid',
        whitelisted: false
      });
    });
  });
});
