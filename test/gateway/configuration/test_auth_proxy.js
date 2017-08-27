const assert = require('assert');
const deepmerge = require('deepmerge');

const auth_proxy_config = require('../../../gateway/configuration/auth_proxy');

const TEST_CONF = {
  gateway: {
    bind: {
      address: '*',
      port: 8080
    },
    domain: 'example.com'
  },
  auth_proxy: {
    bind: {
      address: '*',
      port: 8081
    },
    config_template: 'test/templates/auth/test.ejs',
    extra: {},
    oauth: {
      client: 'client_id',
      secret: 'client_secret',
      provider: 'github'
    },
    prefix: '/auth',
    session: {
      name: 'authgateway',
      refresh: '',
      secret: 'session_secret',
      ttl: '168h'
    }
  },
  http_proxy: {
    bind: {
      port: 443
    }
  },
  apps: []
};


describe('Configuration', () => {
  describe('Auth Proxy', () => {
    it('renders template', () => {
      const expected = {
        address: ':8081',
        callback: 'https://example.com:443/auth/callback',
        domain: 'example.com',
        emails: '',
        oauth: {
          client: 'client_id',
          secret: 'client_secret',
          provider: 'github'
        },
        prefix: '/auth',
        session: {
          name: 'authgateway',
          refresh: '',
          secret: 'session_secret',
          ttl: '168h'
        },
        upstream: 'http://localhost:8080/'
      };
      const config = auth_proxy_config.renderMain(TEST_CONF);
      assert.deepEqual(expected, JSON.parse(config));
    });

    it('renders template with host', () => {
      const test_conf = deepmerge(TEST_CONF, {
        auth_proxy: {bind: {address: '2.4.8.16'}},
        gateway: {bind: {address: '1.2.3.4'}}
      });
      const config = auth_proxy_config.renderMain(test_conf);
      assert.deepEqual('2.4.8.16:8081', JSON.parse(config).address);
      assert.deepEqual('http://1.2.3.4:8080/', JSON.parse(config).upstream);
    });
  });
});
