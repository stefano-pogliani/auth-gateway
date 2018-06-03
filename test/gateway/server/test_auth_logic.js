const assert = require('assert');
const { Config } = require('../../../gateway/configuration');

const TEST_CONFIG = new Config({
  gateway: {domain: 'localhost'},
  http_proxy: {bind: {port: 8080}},
  apps: [{
    name: 'audit',
    audit: {
      host: 'server2:port',
      protocol: 'http',
    }
  }, {
    name: 'app',
    upstream: {
      host: 'server2:port',
      protocol: 'http',
      whitelist: ['/a.*']
    }
  }]
});


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
      const req = {};
      const session = {allowed: true};
      const result = CheckProtectedRequest(session, req, TEST_CONFIG);
      assert.deepEqual(result, {
        allowed: true,
        reason: 'Found valid session',
        whitelisted: false
      });
    });

    it('Allows whitelisted path', () => {
      const req = {
        headers: {
          host: 'app.localhost',
          'x-original-uri': '/abc'
        }
      };
      const session = {allowed: false};
      const result = CheckProtectedRequest(session, req, TEST_CONFIG);
      assert.deepEqual(result, {
        allowed: true,
        reason: "Path allowed by whitelist: '/a.*'",
        whitelisted: true
      });
    });

    it('Rejects invalid sessions', () => {
      const req = {headers: {}};
      const session = {allowed: false};
      const result = CheckProtectedRequest(session, req, TEST_CONFIG);
      assert.deepEqual(result, {
        allowed: false,
        reason: 'Session not valid',
        whitelisted: false
      });
    });

    it('Rejects unkown app', () => {
      const req = {
        headers: {host: 'missing.localhost'}
      };
      const session = {allowed: false};
      const result = CheckProtectedRequest(session, req, TEST_CONFIG);
      assert.deepEqual(result, {
        allowed: false,
        reason: 'Session not valid for unrecognised app',
        whitelisted: false
      });
    });

    it('Rejects app without matching pattern', () => {
      const req = {
        headers: {
          host: 'app.localhost',
          'x-original-uri': '/def'
        }
      };
      const session = {allowed: false};
      const result = CheckProtectedRequest(session, req, TEST_CONFIG);
      assert.deepEqual(result, {
        allowed: false,
        reason: 'Session not valid',
        whitelisted: false
      });
    });
  });
});
