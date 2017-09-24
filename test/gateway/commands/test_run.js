const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
require('prom-client').register.clear();


const mockAuditor = {
  InitialiseAuditor: sinon.spy()
};
const mockProcess = {
  on: sinon.spy()
};
const mockServer = {
  RunWebServer: sinon.spy()
};
const mockShutdown = {
  shutdown: {stop: sinon.spy()}
};
const mockSubprocs = {
  AuthProxy: sinon.spy(),
  InitialiseSubProcs: sinon.spy(),
  HttpProxy: sinon.spy()
};
const mockTmp = {
  setGracefulCleanup: sinon.spy()
};
const { RunCommand } = proxyquire('../../../gateway/commands/run', {
  '../server/auditor': mockAuditor,
  '../server': mockServer,
  '../shutdown': mockShutdown,
  '../subprocs': mockSubprocs,
  'process': mockProcess,
  'tmp': mockTmp
});


describe('Commands', () => {
  describe('Run', () => {
    afterEach(() => {
      mockAuditor.InitialiseAuditor.reset();
      mockProcess.on.reset();
      mockServer.RunWebServer.reset();
      mockShutdown.shutdown.stop.reset();
      mockSubprocs.AuthProxy.reset();
      mockSubprocs.InitialiseSubProcs.reset();
      mockSubprocs.HttpProxy.reset();
      mockTmp.setGracefulCleanup.reset();
    });

    it('configuration', () => {
      const cmd = new RunCommand(null, null);
      assert.equal(null, this.auth_proxy);
      assert.equal(null, this.http_proxy);
    });

    it('_initialiseServer', () => {
      const cmd = new RunCommand(null, null);
      cmd._initialiseServer();
      cmd._handleReload = sinon.spy();
      assert.equal(1, mockTmp.setGracefulCleanup.callCount);
      assert.equal(3, mockProcess.on.callCount);
      assert(mockAuditor.InitialiseAuditor.calledWith(null));
      assert(mockSubprocs.InitialiseSubProcs.calledWith(null));
      assert.equal(1, mockSubprocs.AuthProxy.callCount);
      assert.equal(1, mockSubprocs.HttpProxy.callCount);
      const onSigInt = mockProcess.on.getCall(0).args[1];
      const onSigTerm = mockProcess.on.getCall(1).args[1];
      onSigInt();
      onSigTerm();
      assert.equal(2, mockShutdown.shutdown.stop.callCount);
      const onSigHup = mockProcess.on.getCall(2).args[1];
      onSigHup();
      assert.equal(1, cmd._handleReload.callCount);
    });

    it('_spawnProxies', () => {
      const cmd = new RunCommand(null, null);
      cmd.auth_proxy = {spawn: sinon.spy()};
      cmd.http_proxy = {spawn: sinon.spy()};
      cmd._spawnProxies();
      assert.equal(1, cmd.auth_proxy.spawn.callCount);
      assert.equal(1, cmd.http_proxy.spawn.callCount);
    });

    it('run', () => {
      const cmd = new RunCommand(null, null);
      cmd._initialiseServer = sinon.spy();
      cmd._spawnProxies = sinon.spy();
      cmd.run();
      assert.equal(1, cmd._initialiseServer.callCount);
      assert.equal(1, cmd._spawnProxies.callCount);
      assert(mockServer.RunWebServer.calledWith(null));
    });

    describe('_handleReload', () => {
      beforeEach(() => {
        this.cmd = new RunCommand(null, null);
        this.cmd.auth_proxy = {
          logrotate: sinon.spy(),
          reload: sinon.spy()
        };
        this.cmd.http_proxy = {
          logrotate: sinon.spy(),
          reload: sinon.stub()
        };
      });

      it('signals the procs', () => {
        this.cmd.http_proxy.reload.returns(true);
        this.cmd._handleReload();
        assert.equal(1, this.cmd.auth_proxy.reload.callCount);
        assert.equal(1, this.cmd.auth_proxy.logrotate.callCount);
        assert.equal(1, this.cmd.http_proxy.reload.callCount);
        assert.equal(1, this.cmd.http_proxy.logrotate.callCount);
      });

      it('requires http proxy to reload', () => {
        this.cmd.http_proxy.reload.returns(false);
        assert.throws(() => this.cmd._handleReload(), Error);
      });
    });
  });
});
