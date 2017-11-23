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
  domain: '',
  token_hmac_algorithm: 'sha512'
};


/**
 * ???
 */
module.exports.auditor = {
  provider: 'null'
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
  prefix: 'auth',
  process: {
    name: 'oauth2',
    command: 'oauth2_proxy'
  },
  session: {
    name: 'authgateway',
    refresh: '0s',
    secret: '',
    ttl: '168h'
  },
  signals: {
    logrotate: null,
    reload: null
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
  config_template: path.join(__dirname, '..', '..', 'templates', 'http', 'nginx.ejs'),
  hsts: {
    age: 0
  },
  process: {
    name: 'nginx',
    command: 'nginx'
  },
  signals: {
    logrotate: 'SIGUSR1',
    reload: 'SIGHUP'
  },
  tls: {
    crt_file: '',
    key_file: '',
    terminate: true
  }
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
