const colors = require('colors/safe');

const { renderMain } = require('../configuration/http_proxy');
const { Spawner } = require('../spawner');


let auth_proxy_singleton = null;
let http_proxy_singleton = null;


module.exports.InitialiseSubProcs = (config) => {
  // TODO: Configure the AuthProxy.
  // Colour: magenta

  // Configure the HttpProxy.
  const http_confg = config.http_proxy
  const http_opts = {
    args: http_confg.process.args,
    configFlag: '-c',
    makeConfig: () => renderMain(config),
    tagInformLine: (tag) => colors.blue(`[=${tag}=]`) + ' ',
    tagLine: (tag) => colors.blue(`[-${tag}-]`) + ' '
  };
  http_proxy_singleton = new Spawner(
    http_confg.process.name, http_confg.process.command, http_opts
  );
};


module.exports.HttpProxy = () => {
  if (!http_proxy_singleton) {
    throw Error('Initialise subprocesses before using them');
  }
  return http_proxy_singleton;
}
