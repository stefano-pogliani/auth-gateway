const assert = require('assert');
const deepmerge = require('deepmerge');
const proxyquire = require('proxyquire');
const sinon = require('sinon');


const spySpawner = sinon.spy();
const config = deepmerge(require('../../../gateway/configuration/default'), {
  gateway: {
    base_dir: 'root'
  },
  http_proxy: {
    config_template: 'test/templates/http/main.ejs'
  }
});

const {
  InitialiseSubProcs,
  HttpProxy
} = proxyquire('../../../gateway/subprocs', {
  '../spawner': {
    Spawner: spySpawner
  }
});


describe('Subprocs', () => {
  beforeEach(() => {
    spySpawner.reset();
  });

  describe('initialise', () => {
    it('is required before using subprocs', () => {
      assert.throws(HttpProxy, Error);
    });

    it('configurs the HttpProxy', () => {
      InitialiseSubProcs(config);
      assert(spySpawner.calledWithNew());
      assert(HttpProxy());

      const spawner = spySpawner.getCall(0);
      assert.equal('nginx', spawner.args[0]);
      assert.equal('nginx', spawner.args[1]);

      const opts = spawner.args[2];
      assert.equal(opts.makeConfig(), [
        '{',
        '  "gateway": {',
        '    "address": "localhost",',
        '    "base": 8090,',
        '    "base_dir": "root/http_proxy",',
        '    "auth": 8091,',
        '    "api": 8092,',
        '    "bind": "*:443"',
        '  },',
        '',
        '  "apps": []',
        '}\n'
      ].join('\n'));
      assert.equal('\u001b[34m[=tag=]\u001b[39m ', opts.tagInformLine('tag'));
      assert.equal('\u001b[34m[-tag-]\u001b[39m ', opts.tagLine('tag'));
    });
  });
});
