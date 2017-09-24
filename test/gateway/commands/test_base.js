const assert = require('assert');
require('prom-client').register.clear();

const { Command } = require('../../../gateway/commands/base');


describe('Commands', () => {
  describe('Base', () => {
    it('configuration', () => {
      const cmd = new Command('abc', 'def');
      assert.equal('abc', cmd._args);
      assert.equal('def', cmd._config);
    });

    it('run', () => {
      const cmd = new Command(1, 2);
      assert.throws(cmd.run, Error);
    });
  });
});
