const assert = require('assert');
const deepmerge = require('deepmerge');
const proxyquire = require('proxyquire');
const sinon = require('sinon');


const spySpawner = sinon.spy();
const config = deepmerge(require('../../../gateway/configuration/default'), {
  auth_proxy: {
    config_template: 'test/templates/auth/test.ejs'
  },
  gateway: {
    base_dir: 'root',
    domain: 'example.com'
  },
  http_proxy: {
    config_template: 'test/templates/http/test.ejs',
    tls: {
      crt_file: '/server.crt',
      key_file: '/server.key',
      terminate: true
    }
  }
});

const {
  AuthProxy,
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
      assert.throws(AuthProxy, Error);
      assert.throws(HttpProxy, Error);
    });

    it('configurs the AuthProxy', () => {
      InitialiseSubProcs(config);
      assert(spySpawner.calledWithNew());
      assert(AuthProxy());

      const spawner = spySpawner.getCall(0);
      assert.equal('oauth2', spawner.args[0]);
      assert.equal('oauth2_proxy', spawner.args[1]);

      const opts = spawner.args[2];
      assert.equal(opts.makeConfig(), [
        '{',
        '  "address": "localhost:8091",',
        '  "callback": "https://example.com:443/auth/callback",',
        '  "domain": "example.com",',
        '  "oauth": {',
        '    "client": "",',
        '    "secret": "",',
        '    "provider": "github"',
        '  },',
        '  "prefix": "/auth",',
        '  "session": {',
        '    "name": "authgateway",',
        '    "refresh": "0s",',
        '    "secret": "",',
        '    "ttl": "168h"',
        '  },',
        '  "upstream": "http://localhost:8090/",',
        '  "emails": ""',
        '}\n'
      ].join('\n'));
      assert.equal('\u001b[35m[=tag=]\u001b[39m ', opts.tagInformLine('tag'));
      assert.equal('\u001b[35m[-tag-]\u001b[39m ', opts.tagLine('tag'));
    });

    it('configurs the HttpProxy', () => {
      InitialiseSubProcs(config);
      assert(spySpawner.calledWithNew());
      assert(HttpProxy());

      const spawner = spySpawner.getCall(1);
      assert.equal('nginx', spawner.args[0]);
      assert.equal('nginx', spawner.args[1]);

      const opts = spawner.args[2];
      assert.equal(opts.makeConfig(), [
        '{',
        '  "gateway": {',
        '    "address": "localhost",',
        '    "port": 8090,',
        '    "base_dir": "root/http_proxy",',
        '    "bind": "*:443",',
        '    "domain": "example.com"',
        '  },',
        '  "auth": {',
        '    "host": "localhost",',
        '    "port": 8091,',
        '    "prefix": "/auth"',
        '  },',
        '  "https": {',
        '    "crt_file": "/server.crt",',
        '    "hsts": 0,',
        '    "key_file": "/server.key",',
        '    "terminate": true',
        '  },',
        '  "apps": []',
        '}\n'
      ].join('\n'));
      assert.equal('\u001b[34m[=tag=]\u001b[39m ', opts.tagInformLine('tag'));
      assert.equal('\u001b[34m[-tag-]\u001b[39m ', opts.tagLine('tag'));
    });
  });
});
