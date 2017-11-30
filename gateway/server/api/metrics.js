const Counter = require('prom-client').Counter;
const Histogram = require('prom-client').Histogram;


const AUTH_REQUESTS = new Counter({
  name: 'authgateway_auth_requests',
  help: 'Number of /api/auth requests served',
  labelNames: ['result']
});
module.exports.AUTH_REQUESTS = AUTH_REQUESTS;


const REQUEST_DURATION = new Histogram({
  name: 'authgateway_request_duration',
  help: 'Duration (in seconds) of an endpoint call',
  labelNames: ['endpoint'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5]
});
module.exports.REQUEST_DURATION = REQUEST_DURATION;
