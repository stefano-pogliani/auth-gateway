const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const { VersionCommand } = proxyquire('../../../gateway/commands/version', {
  '../../package': {'version': 'a.b.c'}
});


describe('Command', () => {
  describe('VersionCommand', () => {
    afterEach(() => {
      this.spyLog.restore();
    });
    beforeEach(() => {
      this.cmd = new VersionCommand([], {});
      this.spyLog = sinon.spy(console, 'log');
    });

    it('run', () => {
      this.cmd.run();
      assert.equal('AuthGateway version: %s', this.spyLog.getCall(0).args[0]);
      assert.equal('a.b.c', this.spyLog.getCall(0).args[1]);
    });
  });
});
