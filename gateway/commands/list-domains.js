const { Command } = require('./base');
const configuration = require('../configuration');


/**
 * List all the domains and subdomains that are served
 * by the HTTP Proxy (usefull for TLS certificates).
 */
class ListDomainsCommand extends Command {
  run() {
    const conf = this._config;
    const apps = conf.enhancedApps().filter(
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

    for (const app of apps) {
      const sub = app.upstream.subdomain;
      console.log(sub + '.' + root_domain);
    }
  }
};
module.exports.ListDomainsCommand = ListDomainsCommand;
