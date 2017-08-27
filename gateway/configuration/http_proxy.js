const path = require('path');
const configuration = require('.');


/**
 * Renders the main configuration file for the HTTP Proxy.
 *
 * By default this is nginx (Caddy does not support the
 * auth_request directive).
 * The configuration should be flexible enough to mean
 * that HTTP proxies can be changed without code support.
 */
module.exports.renderMain = function renderMain(config) {
  // Figure out some options.
  let auth_host = 'localhost';
  let gateway_host = 'localhost';
  if (config.auth_proxy.bind.address !== '*') {
    auth_host = config.auth_proxy.bind.address;
  }
  if (config.gateway.bind.address !== '*') {
    gateway_host = config.gateway.bind.address;
  }

  // Get tempate and context.
  const template = config.http_proxy.config_template;
  let context = {
    apps: config.apps,
    auth: {
      host: auth_host,
      port: config.auth_proxy.bind.port,
      prefix: config.auth_proxy.prefix
    },
    dirs: {
      base: path.join(config.gateway.base_dir, 'http_proxy'),
      static: path.join(__dirname, '..', 'server', 'static')
    },
    gateway: {
      host: gateway_host,
      port: config.gateway.bind.port,
      domain: config.gateway.domain
    },
    proxy: {
      bind: config.http_proxy.bind,
      tls: config.http_proxy.tls
    }
  };

  // Render the config file.
  return configuration.render(template, context);
};
