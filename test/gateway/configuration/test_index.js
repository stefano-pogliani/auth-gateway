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
  gateway: {domain: 'example.com'},
  auth_proxy: {},
  http_proxy: {
    bind: {port: 443}
  },
  apps: []
};

const configuration = proxyquire('../../../gateway/configuration', {
  'fs': mockFs,
  './default': mockDefaultConf
});


describe('Configuration', () => {
  describe('enhanceApp', () => {
    const config = configuration.load();
    const enhanceApp = configuration.enhanceApp(config._raw);

    it('Enhance audited apps', () => {
      const app = enhanceApp({
        name: 'test',
        audit: {}
      });
      assert.deepEqual(app, {
        id: 'test',
        name: 'test',
        title: 'test',
        type: 'audited',
        audit: {
          url: 'https://test.example.com:443/',
          server_name: 'test.example.com'
        }
      });
    });
  });

  describe('load', () => {
    it('ignores missing default', () => {
      mockFs.readFileSync = sinon.stub().throws();
      let config = configuration.load();

      assert(mockFs.readFileSync.calledOnce);
      assert.deepEqual(mockFs.readFileSync.getCall(0).args, [
        DEFAULT_CONF_FILE, 'utf8'
      ]);
      assert.deepEqual(config._raw, {
        apps: [],
        auditor: {provider: 'null'},
        gateway: {domain: 'example.com'},
        auth_proxy: {},
        http_proxy: {
          bind: {port: 443}
        }
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
      assert.deepEqual(config._raw, {
        apps: [],
        auditor: {provider: 'null'},
        gateway: {
          a: {b: 'c'},
          domain: 'example.com'
        },
        auth_proxy: {},
        http_proxy: {
          bind: {port: 443}
        }
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
