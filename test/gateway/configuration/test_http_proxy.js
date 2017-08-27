const assert = require('assert');
const deepmerge = require('deepmerge');

const http_proxy_config = require('../../../gateway/configuration/http_proxy');

const TEST_CONF = {
  gateway: {
    base_dir: 'root/',
    bind: {
      address: '*',
      port: 8080
    },
    domain: 'example'
  },
  auth_proxy: {
    bind: {
      address: '*',
      port: 8091
    },
    prefix: '/auth'
  },
  http_proxy: {
    bind: {
      address: '*',
      port: 443
    },
    tls: {
      crt_file: '/server.crt',
      key_file: '/server.key',
      terminate: true
    },
    config_template: 'test/templates/http/test.ejs'
  },
  apps: [{
    name: 'test1',
    mount: '/test1',
    upstream: [
      'server1',
      'server2'
    ]
  }, {
    name: 'test2',
    mount: '/test2',
    upstream: [
      'server3',
      'server4'
    ]
  }]
};


describe('Configuration', () => {
  describe('HTTP Proxy', () => {
    it('renders template', () => {
      const expected = {
        gateway: {
          address: 'localhost',
          port: 8080,
          base_dir: 'root/http_proxy',
          bind: "*:443",
          domain: 'example'
        },
        auth: {
          host: 'localhost',
          port: 8091,
          prefix: '/auth'
        },
        https: {
          crt_file: '/server.crt',
          key_file: '/server.key',
          terminate: true
        },
        apps: [{
          name: 'test1',
          mount: '/test1',
          upstream: [
            'server1',
            'server2'
          ]
        }, {
          name: 'test2',
          mount: '/test2',
          upstream: [
            'server3',
            'server4'
          ]
        }]
      };
      const config = http_proxy_config.renderMain(TEST_CONF);
      assert.deepEqual(expected, JSON.parse(config));
    });

    it('renders template with host', () => {
      const test_conf = deepmerge(TEST_CONF, {
        gateway: {bind: {address: '1.2.3.4'}}
      });
      const config = http_proxy_config.renderMain(test_conf);
      assert.deepEqual('1.2.3.4', JSON.parse(config).gateway.address);
    });
  });
});
