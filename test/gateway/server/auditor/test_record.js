const assert = require('assert');

const {
  AuditRecord
} = require('../../../../gateway/server/auditor/record');


describe('Server', () => {
  describe('Auditor', () => {
    describe('Record', () => {
      it('Has the expected shape', () => {
        const req = {
          get(name) { return this[name]; },
          'Host': 'host',
          'X-Forwarded-Proto': 'proto',
          'X-Original-URI': '/uri'
        };
        const session = {
          email: 'email',
          allowed: true,
          id: 'abcd',
          user: 'me'
        };
        const result = {
          allowed: true,
          reason: 'test',
          whitelisted: false
        };
        const record = AuditRecord(req, session, result, 'https', 123);
        assert.deepEqual(record, {
          email: 'email',
          protocol: 'https',
          resource: 'proto://host/uri',
          reason: 'test',
          result: 'allow',
          session_id: 'abcd',
          timestamp: 123,
          user: 'me',
          whitelisted: false
        });
      });
    });
  });
});
