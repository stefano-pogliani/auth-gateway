const assert = require('assert');
const sinon = require('sinon');
require('prom-client').register.clear();

const { Config } = require('../../../gateway/configuration');
const {
  ListDomainsCommand
} = require('../../../gateway/commands/list-domains');


const TEST_CONF = new Config({
  gateway: {
    domain: 'example.com'
  },
  http_proxy: {
    bind: {port: 80}
  },
  apps: [{
    name: 'test4'
  }, {
    name: 'test1',
    title: 'Abc',
    url: 'abc'
  }, {
    name: 'test2',
    upstream: {
      host: 'host:port',
      protocol: 'https'
    }
  }, {
    name: 'test3',
    type: 'upstream',
    upstream: {
      host: 'host:port',
      protocol: 'https',
      subdomain: 'domain'
    }
  }, {
    name: 'test5',
    type: 'upstream',
    upstream: {
      host: 'host:port',
      protocol: 'https'
    }
  }, {
    name: 'test6',
    type: 'upstream',
    upstream: {
      host: 'host:port',
      protocol: 'https',
      subdomain: 'domain'
    }
  }, {
    name: 'test8',
    type: 'audited',
    audit: { host: 'host:port' }
  }, {
    name: 'test7',
    type: 'audited',
    audit: { host: 'host:port' }
  }, {
    id: 'test9a',
    name: 'test9',
    type: 'audited',
    audit: { host: 'host:port' }
  }, {
    id: 'test9b',
    name: 'test9',
    type: 'audited',
    audit: { host: 'host:port' }
  }]
});


describe('Commands', () => {
  describe('ListDomainsCommand', () => {
    afterEach(() => {
      this.spyLog.restore();
    });
    beforeEach(() => {
      this.cmd = new ListDomainsCommand([], TEST_CONF);
      this.spyLog = sinon.spy(console, 'log');
    });

    it('run', () => {
      this.cmd.run();
      assert.equal('example.com', this.spyLog.getCall(0).args[0]);
      assert.equal('domain.example.com', this.spyLog.getCall(1).args[0]);
      assert.equal('domain.example.com', this.spyLog.getCall(2).args[0]);
      assert.equal('test2.example.com', this.spyLog.getCall(3).args[0]);
      assert.equal('test5.example.com', this.spyLog.getCall(4).args[0]);
      assert.equal('test7.example.com', this.spyLog.getCall(5).args[0]);
      assert.equal('test8.example.com', this.spyLog.getCall(6).args[0]);
      assert.equal('test9.example.com', this.spyLog.getCall(7).args[0]);
      assert.equal('test9.example.com', this.spyLog.getCall(8).args[0]);
    });
  });
});
