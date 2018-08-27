const fs = require('fs');
const yaml = require('js-yaml');
const MongoClient = require('mongodb').MongoClient;

const datafetcher = require('./datafetcher');
const emailer = require('./emailer');
const renderer = require('./renderer');


/**
 * Load the (required) configuration file.
 */
const configure = () => {
  const config_path = process.argv[2] || 'report.yaml';
  console.log('Loading configuration from %s ...', config_path);
  const data = fs.readFileSync(config_path, 'utf8');
  const conf = yaml.safeLoad(data, {filename: config_path});

  // Extend the configuration with derived parameters.
  const millisec_before = conf.report_days * datafetcher.MILLISECS_IN_DAY;
  conf.end_time = Date.now();
  conf.start_time = conf.end_time - millisec_before;
  return conf;
};


/**
 * The main functions, starts execution of the report.
 */
const main = () => {
  const conf = configure();
  console.log('Reporting on events since', new Date(conf.start_time));
  MongoClient.connect(conf.mongo).then((client) => {
    const db = client.db();
    const collection = db.collection(conf.collection);
    const fetcher = datafetcher.fetch(
      collection, conf.start_time, conf.end_time
    );
    return fetcher.then((data) => {
      client.close();
      console.log('Report data:', JSON.stringify(data, null, 2));
      return data;
    });

  }).then((data) => {
    const report = renderer.render(data);
    if (conf.report_store_last) {
      console.log('Stroing report as:', conf.report_store_last);
      fs.writeFileSync(conf.report_store_last, report);
    }
    return {
      report: report,
      subject: data.meta.title
    };

  }).then(({report, subject}) => {
    if (conf.email_skip) {
      return;
    }
    return emailer.email(conf, subject, report);

  }).catch((err) => {
    console.log('Failed!', err);
    process.exit(1);
  });
};
main();
