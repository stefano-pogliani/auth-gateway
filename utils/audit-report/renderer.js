import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import ejs from 'ejs';

const __dirname = dirname(fileURLToPath(import.meta.url));


/**
 * Scale a value to a percentage of the total requests.
 */
const scaleValue = (report) => {
  const total = report.requests.total;
  return (current) => (current * 100) / total;
};


/**
 * Renders the report data into an email friendly HTML page.
 */
export const render = (report) => {
  const template = path.join(__dirname, 'templates', 'report.html');
  const blob = fs.readFileSync(template, 'utf8');
  // Rebuild a context with extra helpers.
  const context = {
    meta: report.meta,
    report: report.report,
    scaleValue: scaleValue(report.report),
  }
  return ejs.render(blob, context, {filename: template});
};
