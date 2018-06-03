const deepmerge = require('deepmerge');
const ejs = require('ejs');
const fs = require('fs');
const yaml = require('js-yaml');

const default_config = require('./default');
const { DEFAULT_CONF_FILE } = require('../constants');

const PROXIED_TYPES = new Set(['audited', 'upstream']);


/**
 * Configuration manager and manupulator.
 *
 * Stores the loaded condifuration (merged with the defaults)
 * and provides access to it through helper methods and data structure views.
 */
class Config {
  constructor(config) {
    this._raw = config;
    this._enhanced_apps = null;
    this._apps_by_host = null;
  }

  /**
   * Finds an app configuration based on the host header.
   *
   * The apps are indexed by host the first time this method is used
   * to provide a more efficient lookup of apps.
   */
  appForHost(host) {
    if (this._apps_by_host === null) {
      const index = {};
      const domain = this._raw.gateway.domain;
      this.enhancedApps().forEach((app, idx) => {
        // Only look at upstream apps.
        if (app.type !== 'upstream') {
          return;
        }
        const host = `${app.upstream.subdomain}.${domain}`;
        index[host] = idx;
      });
      this._apps_by_host = index;
    }
    const idx = this._apps_by_host[host];
    if (idx) {
      return this._raw.apps[idx];
    }
    return null;
  }

  /**
   * Access the autitor configuration.
   *
   * TODO: schema
   */
  auditor() {
    return {...this._raw.auditor};
  }

  /**
   * Access the Auth proxy configuration.
   * 
   * TODO: schema
   */
  auth_proxy() {
    return {...this._raw.auth_proxy};
  }

  /**
   * Returns the list of apps normalized and extedned.
   *
   * TODO: schema
   */
  enhancedApps() {
    if (this._enhanced_apps === null) {
      const enhanceApp = module.exports.enhanceApp(this._raw);
      const apps = this._raw.apps.map(enhanceApp);
      this._enhanced_apps = apps;
    }
    return this._enhanced_apps;
  }

  /**
   * Access gateway configuration.
   *
   * TODO: schema
   */
  gateway() {
    return {...this._raw.gateway};
  }

  /**
   * Access HTTP proxy configuration.
   *
   * TODO: schema
   */
  http_proxy() {
    return {...this._raw.http_proxy};
  }
};
module.exports.Config = Config;


/**
 * Returns a new object with the app configuration plus
 * some automatically detected fields.
 *
 * Does not perform validation.
 */
module.exports.enhanceApp = (config) => {
  return (real_app) => {
    const app = deepmerge({}, real_app);
    app.id = app.name.toLowerCase();

    if (!app.title) {
      app.title = app.name;
    }

    if (!app.type) {
      if (app.audit) {
        app.type = 'audited';
      } else if (app.upstream) {
        app.type = 'upstream';
      } else if (app.url) {
        app.type = 'link';
      } else {
        app.type = 'unknown';
      }
    }

    if (app.type === 'audited' && !app.audit.server_name) {
      const host = config.gateway.domain;
      const name = app.name.toLowerCase();
      app.audit.server_name = `${name}.${host}`;
    }
    if (app.type === 'audited' && !app.audit.url) {
      const server_name = app.audit.server_name;
      const port = config.http_proxy.bind.port;
      app.audit.url = `https://${server_name}:${port}/`;
    }

    if (app.type === 'upstream' && !app.upstream.subdomain) {
      app.upstream.subdomain = app.name.toLowerCase();
    }
    if (app.type === 'upstream' && !app.upstream.whitelist) {
      app.upstream.whitelist = [];
    }

    if (PROXIED_TYPES.has(app.type)) {
      app.options = app.options || {};
    }
    return app;
  };
};


/**
 * Load a configuration file and use it to override
 * default values.
 *
 * @param {string} config_path YAML file to load.
 * @returns {Object} The DEFAULT_CONFIG overriden with options
 *                   from the given file.
 */
module.exports.load = function load(config_path) {
  let conf = {};
  let required = true;

  // Use default config is none given.
  if (!config_path) {
    config_path = DEFAULT_CONF_FILE;
    required = false;
  }

  // Attempt to YAML load the config file.
  try {
    let data = fs.readFileSync(config_path, 'utf8');
    conf = yaml.safeLoad(data, {filename: config_path});
  } catch (ex) {
    if (required) {
      throw ex;
    }
  }

  // Merge default with config file.
  const config = deepmerge(default_config, conf);
  return new Config(config);
};


/**
 * Uses EJS to render a file.
 * 
 * @param {string} template Path to the template to render.
 * @param {Object} contect  The context to render with.
 */
module.exports.render = function render(template, context) {
  const source = fs.readFileSync(template, 'utf8');
  return ejs.render(source, context, {
    filename: template,
    compileDebug: true,
    _with: true
  });
};
