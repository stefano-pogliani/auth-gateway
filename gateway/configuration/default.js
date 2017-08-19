const path = require('path');


/**
 * ???
 */
module.exports.gateway = {
  base_dir: path.join(__dirname, '..', '..'),
  bind: {
    address: 'localhost',
    port: 8090
  }
};


/**
 * ???
 */
module.exports.auth_proxy = {
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
  config_template: path.join(__dirname, '..', '..', 'templates', 'nginx', 'main.ejs')
};


/**
 * ???
 */
module.exports.apps = [];
