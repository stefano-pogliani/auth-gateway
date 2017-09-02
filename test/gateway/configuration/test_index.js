const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const {
  DEFAULT_CONF_FILE
} = require('../../../gateway/constants');

const mockFs = {
  readFileSync: sinon.spy()
};
const mockDefaultConf = {
  gateway: {},
  auth_proxy: {},
  http_proxy: {},
  apps: []
};

const configuration = proxyquire('../../../gateway/configuration', {
  'fs': mockFs,
  './default': mockDefaultConf
});


describe('Configuration', () => {
  describe('load', () => {
    it('ignores missing default', () => {
      mockFs.readFileSync = sinon.stub().throws();
      let config = configuration.load();

      assert(mockFs.readFileSync.calledOnce);
      assert.deepEqual(mockFs.readFileSync.getCall(0).args, [
        DEFAULT_CONF_FILE, 'utf8'
      ]);
      assert.deepEqual(config, {
        apps: [],
        auditor: {provider: 'null'},
        gateway: {},
        auth_proxy: {},
        http_proxy: {}
      });
    });

    it('fails if given path is missing', () => {
      mockFs.readFileSync = sinon.stub().throws();
      assert.throws(() => configuration.load('/some/missing/file'), Error);
    });

    it('recursively merges yaml', () => {
      mockFs.readFileSync = sinon.stub().returns(
        'gateway: {a: {b: c}}'
      );
      let config = configuration.load('abc');
      assert.deepEqual(config, {
        apps: [],
        auditor: {provider: 'null'},
        gateway: {a: {b: 'c'}},
        auth_proxy: {},
        http_proxy: {}
      });
    });
  });

  describe('render', () => {
    it('renders the argument with the given context', () => {
      mockFs.readFileSync = sinon.stub().returns(
        'ABC<%- D %>EFG'
      );
      let context = {D: 'd'};
      let content = configuration.render('test.ejs', context);
      assert.equal('ABCdEFG', content);
    });
  });
});
