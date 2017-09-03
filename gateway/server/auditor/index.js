const { ConsoleAuditor } = require('./console');
const { HttpAuditor } = require('./http');
const { NullAuditor } = require('./null');
const { TestAuditor } = require('./test');


const AUDITORS = {
  console: ConsoleAuditor,
  http: HttpAuditor,
  null: NullAuditor,
  test: TestAuditor
};

let auditor_instance = null;


/**
 * Initialises the auditor sub-system with the given config.
 */
module.exports.InitialiseAuditor = (config) => {
  const conf = config.auditor;
  const klass = AUDITORS[conf.provider];
  if (!klass) {
      throw Error(`Unsupported auditor provider '${conf.provider}'`);
  }
  auditor_instance = new klass(conf);
};


/**
 * Returns the active auditor instance.
 */
module.exports.Instance = () => {
  if (auditor_instance) {
    return auditor_instance;
  }
  throw Error('Auditor sub-system not initialised');
};


/**
 * Resets the auditor for tests.
 * Can only reset a test auditor.
 */
module.exports.Reset = () => {
  if (auditor_instance instanceof TestAuditor) {
    auditor_instance = null;
  }
}
