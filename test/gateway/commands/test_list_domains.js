const assert = require('assert');
const sinon = require('sinon');
require('prom-client').register.clear();

const {
  ListDomainsCommand
} = require('../../../gateway/commands/list-domains');


const TEST_CONF = {
  gateway: {
    domain: 'example.com'
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
  }]
};


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
    });
  });
});
