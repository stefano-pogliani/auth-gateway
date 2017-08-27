const assert = require('assert');
const deepmerge = require('deepmerge');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const config = deepmerge(
  require('../../../gateway/configuration/default'), {}
);

const mockApp = {
  app: {
    listen: sinon.stub(),
    set: sinon.spy()
  },
  logAppMessage: sinon.spy()
};
const mockShutdown = {
  once: sinon.spy()
};

const { RunWebServer } = proxyquire('../../../gateway/server', {
  './app': mockApp,
  '../shutdown': {shutdown: mockShutdown}
});


describe('Server', () => {
  describe('instance', () => {
    afterEach(() => {
      mockApp.app.listen.reset();
      mockApp.logAppMessage.reset();
      mockShutdown.once.reset();
    });

    it('starts listening', () => {
      RunWebServer(config);
      assert(mockApp.app.listen.calledWith(8090, 'localhost'));
    });

    it('prints address when ready', () => {
      RunWebServer(config);
      const onListen = mockApp.app.listen.getCall(0).args[2];
      onListen();
      assert.equal(1, mockApp.logAppMessage.callCount);
    });

    it('stops on shutdown', () => {
      const mockServer = {
        close: sinon.spy()
      };
      mockApp.app.listen.returns(mockServer);
      RunWebServer(config);
      const onStop = mockShutdown.once.getCall(0).args[1];
      onStop();
      assert.equal(1, mockApp.logAppMessage.callCount);
      assert.equal(1, mockServer.close.callCount);
    });

    it('stops on startup error', () => {
      const mockServer = {
        close: sinon.spy()
      };
      mockApp.app.listen.returns(mockServer);
      RunWebServer(config);
      const onListen = mockApp.app.listen.getCall(0).args[2];
      const onStop = mockShutdown.once.getCall(0).args[1];
      onStop();
      onListen();
      assert.equal(3, mockApp.logAppMessage.callCount);
      assert.equal(2, mockServer.close.callCount);
    });
  });
});
