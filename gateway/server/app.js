const path = require('path');
const colors = require('colors');
const express = require('express');
const cookieParser = require('cookie-parser')


const Counter = require('prom-client').Counter;
const REQUESTS_COUNT = new Counter({
  name: 'authgateway_requests_total',
  help: 'Number of requests served by the web app',
  labelNames: ['code']
});


const logAppMessage = (message) => {
  const me = colors.green('[-app-]');
  console.log(`${me} ${message}`);
};
module.exports.logAppMessage = logAppMessage;


const countRequests = (req, res, next) => {
  /* istanbul ignore next */
  res.on('finish', () => {
    const statusCode = res.statusCode;
    REQUESTS_COUNT.labels(statusCode).inc();
  });
  next();
};
module.exports.countRequests = countRequests;


const app = express();
app.use(countRequests);
app.use(cookieParser());
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));
module.exports.app = app;
