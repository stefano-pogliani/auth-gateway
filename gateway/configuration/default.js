const path = require('path');


/**
 * ???
 */
module.exports.gateway = {
  base_dir: path.join(__dirname, '..', '..'),
  bind: {
    address: 'localhost',
    port: 8090
  },
  domain: ''
};


/**
 * ???
 */
module.exports.auth_proxy = {
  bind: {
    address: 'localhost',
    port: 8091
  },
  config_template: path.join(__dirname, '..', '..', 'templates', 'auth', 'oauth2.ejs'),
  extra: {},
  oauth: {
    client: '',
    secret: '',
    provider: 'github'
  },
  prefix: '/auth',
  process: {
    name: 'oauth2',
    command: 'oauth2_proxy'
  },
  session: {
    name: 'authgateway',
    refresh: '0s',
    secret: '',
    ttl: '168h'
  }
};


/**
 * ???
 */
module.exports.http_proxy = {
  bind: {
    address: '*',
    port: 443
  },
  process: {
    name: 'nginx',
    command: 'nginx'
  },
  tls: {
    crt_file: '',
    key_file: '',
    terminate: true
  },
  config_template: path.join(__dirname, '..', '..', 'templates', 'http', 'nginx.ejs')
};


/**
 * List of apps to be proxied to.
 *
 * {
 *   "name": <string>,
 *   "type": <sting{link,upstream}>,
 *   "url": <string|null>,
 *   "upstream": {
 *     "host": <string>,
 *     "protocol": <string>,
 *     "subdomain": <string>
 *   }
 * }
 */
module.exports.apps = [];
