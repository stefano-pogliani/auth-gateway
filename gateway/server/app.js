const path = require('path');
const colors = require('colors');
const express = require('express');
const cookieParser = require('cookie-parser')


const logAppMessage = (message) => {
  const me = colors.green('[-app-]');
  console.log(`${me} ${message}`);
};
module.exports.logAppMessage = logAppMessage;


const app = express();
app.use(cookieParser());
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));
module.exports.app = app;
