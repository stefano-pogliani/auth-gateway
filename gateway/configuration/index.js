const deepmerge = require('deepmerge');
const ejs = require('ejs');
const fs = require('fs');
const yaml = require('js-yaml');

const default_config = require('./default');
const {
  DEFAULT_CONF_FILE
} = require('../constants');


/**
 * Returns a new object with the app configuration plus
 * some automatically detected fields.
 *
 * Does not perform validation.
 */
module.exports.enhanceApp = function enhanceApp(real_app) {
  const app = deepmerge({}, real_app);
  if (!app.title) {
    app.title = app.name;
  }

  if (!app.type) {
    if (app.upstream) {
      app.type = 'upstream';
    } else if (app.url) {
      app.type = 'link';
    } else {
      app.type = 'unknown';
    }
  }

  if (app.type === 'upstream' && !app.upstream.subdomain) {
    app.upstream.subdomain = app.name.toLowerCase();
  }
  return app;
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
  return deepmerge(default_config, conf);
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
