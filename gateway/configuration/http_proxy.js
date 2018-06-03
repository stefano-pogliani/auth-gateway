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
  let auth_proxy = config.auth_proxy();
  let gateway = config.gateway();
  let http_proxy = config.http_proxy();

  // Figure out some options.
  let auth_host = 'localhost';
  let gateway_host = 'localhost';
  if (auth_proxy.bind.address !== '*') {
    auth_host = auth_proxy.bind.address;
  }
  if (gateway.bind.address !== '*') {
    gateway_host = gateway.bind.address;
  }

  // Get tempate and context.
  const template = http_proxy.config_template;
  const audited = config.enhancedApps().filter((app) => {
    return app.type === 'audited';
  });
  const upstreams = config.enhancedApps().filter((app) => {
    return app.type === 'upstream';
  });

  let context = {
    apps: {
      audited: audited,
      upstreams: upstreams
    },
    auth: {
      host: auth_host,
      port: auth_proxy.bind.port,
      prefix: auth_proxy.prefix
    },
    dirs: {
      base: path.join(gateway.base_dir, 'http_proxy'),
      static: path.join(__dirname, '..', 'server', 'static')
    },
    gateway: {
      host: gateway_host,
      port: gateway.bind.port,
      domain: gateway.domain
    },
    proxy: {
      bind: http_proxy.bind,
      hsts: http_proxy.hsts,
      tls: http_proxy.tls
    }
  };

  // Render the config file.
  return configuration.render(template, context);
};
