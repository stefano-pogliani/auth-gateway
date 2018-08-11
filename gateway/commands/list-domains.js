const { Command } = require('./base');
const configuration = require('../configuration');


/**
 * List all the domains and subdomains that are served
 * by the HTTP Proxy (usefull for TLS certificates).
 */
class ListDomainsCommand extends Command {
  run() {
    const conf = this._config;
    const apps = conf.enhancedApps();

    const audited = apps.filter(
      (app) => app.type === 'audited'
    ).sort((left, right) => {
      if (left.audit.server_name < right.audit.server_name) {
        return -1;
      }
      if (left.audit.server_name > right.audit.server_name) {
        return 1;
      }
      return 0;
    });
    const upstreams = apps.filter(
      (app) => app.type === 'upstream'
    ).sort((left, right) => {
      if (left.upstream.subdomain < right.upstream.subdomain) {
        return -1;
      }
      if (left.upstream.subdomain > right.upstream.subdomain) {
        return 1;
      }
      return 0;
    });

    const root_domain = conf.gateway().domain;
    console.log(root_domain);
    for (const app of upstreams) {
      const sub = app.upstream.subdomain;
      console.log(sub + '.' + root_domain);
    }
    for (const app of audited) {
      console.log(app.audit.server_name);
    }
  }
};
module.exports.ListDomainsCommand = ListDomainsCommand;
