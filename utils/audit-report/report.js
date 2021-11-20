import fs from 'fs';
import yaml from 'js-yaml';
import { MongoClient } from 'mongodb';

import { fetch as datafetch } from './datafetcher.js';
import { MILLISECS_IN_DAY } from './datafetcher.js';
import { email } from './emailer.js';
import { render } from './renderer.js';


/**
 * Load the (required) configuration file.
 */
const configure = () => {
  const config_path = process.argv[2] || 'report.yaml';
  console.log('Loading configuration from %s ...', config_path);
  const data = fs.readFileSync(config_path, 'utf8');
  const conf = yaml.load(data, {filename: config_path});

  // Extend the configuration with derived parameters.
  const millisec_before = conf.report_days * MILLISECS_IN_DAY;
  conf.end_time = new Date();
  conf.start_time = new Date(conf.end_time - millisec_before);
  return conf;
};


/**
 * Fetch auit data from MongoDB and return it for rendering.
 */
async function fetch(conf) {
  const mongo = new MongoClient(conf.mongo);
  await mongo.connect();
  const db = mongo.db();
  const collection = db.collection(conf.collection);
  const data = await datafetch(
    collection, conf.start_time, conf.end_time, conf.report_title
  );
  mongo.close();
  return data;
}


/**
 * The main functions, starts execution of the report.
 */
async function main() {
  const conf = configure();
  console.log('Reporting on events since', new Date(conf.start_time));

  try {
    const data = await fetch(conf);
    console.debug('Report data:', JSON.stringify(data, null, 2));

    // Render and possibly store report.
    const report = render(data);
    if (conf.report_store_last) {
      console.log('Stroing report as:', conf.report_store_last);
      fs.writeFileSync(conf.report_store_last, report);
    }

    // Email report if configured.
    if (conf.email_skip) {
      return;
    }
    await email(conf, data.meta.title, report);

  } catch(err) {
    console.log('Failed!', err);
    process.exit(1);
  }
};

// Invoke top-level async main.
// This won't block but will still wait for the promise to resolve before existing.
await main();
