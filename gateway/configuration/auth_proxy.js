const path = require('path');
const configuration = require('.');


/**
 * Renders the main configuration file for the Auth Proxy.
 *
 * By default this is oauth2_proxy from bitly.
 * The configuration should be flexible enough to mean
 * that Auth proxies can be changed without code changes.
 */
module.exports.renderMain = function renderMain(config) {
  // Figure out some options.
  let auth_host = '';
  let auth_conf = config.auth_proxy;
  let gateway_host = 'localhost';
  if (auth_conf.bind.address !== '*') {
    auth_host = auth_conf.bind.address;
  }
  if (config.gateway.bind.address !== '*') {
    gateway_host = config.gateway.bind.address;
  }

  // Get tempate and context.
  const template = auth_conf.config_template;
  let context = {
    auth: {
      bind: {
        address: auth_host,
        port: auth_conf.bind.port
      },
      extra: auth_conf.extra,
      oauth: auth_conf.oauth,
      prefix: auth_conf.prefix,
      session: auth_conf.session
    },
    gateway: {
      domain: config.gateway.domain,
      host: gateway_host,
      port: config.gateway.bind.port
    },
    proxy: {
      port: config.http_proxy.bind.port
    }
  };

  // Render the config file.
  return configuration.render(template, context);
};
