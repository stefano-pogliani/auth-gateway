const colors = require('colors/safe');

const conf_auth = require('../configuration/auth_proxy');
const conf_http = require('../configuration/http_proxy');
const { Spawner } = require('../spawner');


let auth_proxy_singleton = null;
let http_proxy_singleton = null;


module.exports.InitialiseSubProcs = (config) => {
  // Configure the AuthProxy.
  const auth_confg = config.auth_proxy
  const auth_opts = {
    args: auth_confg.process.args,
    configFlag: '--config',
    makeConfig: () => conf_auth.renderMain(config),
    tagInformLine: (tag) => colors.magenta(`[=${tag}=]`) + ' ',
    tagLine: (tag) => colors.magenta(`[-${tag}-]`) + ' '
  };
  auth_proxy_singleton = new Spawner(
    auth_confg.process.name, auth_confg.process.command, auth_opts
  );

  // Configure the HttpProxy.
  const http_confg = config.http_proxy
  const http_opts = {
    args: http_confg.process.args,
    configFlag: '-c',
    makeConfig: () => conf_http.renderMain(config),
    tagInformLine: (tag) => colors.blue(`[=${tag}=]`) + ' ',
    tagLine: (tag) => colors.blue(`[-${tag}-]`) + ' '
  };
  http_proxy_singleton = new Spawner(
    http_confg.process.name, http_confg.process.command, http_opts
  );
};


module.exports.AuthProxy = () => {
  if (!auth_proxy_singleton) {
    throw Error('Initialise subprocesses before using them');
  }
  return auth_proxy_singleton;
}


module.exports.HttpProxy = () => {
  if (!http_proxy_singleton) {
    throw Error('Initialise subprocesses before using them');
  }
  return http_proxy_singleton;
}
