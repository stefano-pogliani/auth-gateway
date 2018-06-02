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
    prefix: 'auth'
  },
  http_proxy: {
    bind: {
      address: '*',
      port: 443
    },
    hsts: { age: 8 },
    tls: {
      crt_file: '/server.crt',
      key_file: '/server.key',
      terminate: true
    },
    config_template: 'test/templates/http/test.ejs'
  },
  apps: [{
    name: 'test1',
    upstream: {
      host: 'server1:port',
      protocol: 'http'
    }
  }, {
    name: 'test2',
    upstream: {
      host: 'server2:port',
      protocol: 'http',
      whitelist: ['/.*']
    }
  }, {
    name: 'test3',
    audit: {
      host: 'server2:port',
      protocol: 'http'
    }
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
          hsts: 8,
          terminate: true
        },
        apps: {
          audited: [{
            id: 'test3',
            name: 'test3',
            title: 'test3',
            type: "audited",
            audit: {
              url: 'https://test3.example:443/',
              server_name: 'test3.example',
              host: 'server2:port',
              protocol: 'http'
            }
          }],
          upstreams: [{
            id: 'test1',
            name: 'test1',
            title: 'test1',
            type: 'upstream',
            upstream: {
              subdomain: 'test1',
              host: 'server1:port',
              protocol: 'http',
              whitelist: []
            }
          }, {
            id: 'test2',
            name: 'test2',
            title: 'test2',
            type: 'upstream',
            upstream: {
              subdomain: 'test2',
              host: 'server2:port',
              protocol: 'http',
              whitelist: ['/.*']
            }
          }]
        }
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
