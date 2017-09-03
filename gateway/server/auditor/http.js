const request = require('request');

const { Auditor } = require('./base');
const { logAppMessage } = require('../app');


class HttpAuditor extends Auditor {
  constructor(conf) {
    super(conf);
    if (!this.conf.endpoint) {
      throw new Error('Need and endpoint to POST to');
    }
  }
  audit(event) {
    return new Promise((resolve) => {
      const options = {
        body: event,
        json: true,
        method: 'POST',
        url: this.conf.endpoint
      };
      request(options, (err, res) => {
        try {
          if (err || res.statusCode < 200 || res.statusCode >= 300) {
            logAppMessage('Failed to audit a request, denying it');
            resolve(500);
          } else {
            resolve(null);
          }
        } catch (e) {
          logAppMessage('Audit callback failed, denying request');
          resolve(500);
        }
      });
    });
  }
};
module.exports.HttpAuditor = HttpAuditor;
