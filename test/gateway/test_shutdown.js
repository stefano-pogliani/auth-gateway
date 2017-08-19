const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const mockProcess = {
  exitCode: 0,
  exit: () => {}
}
const { ShutdownManager } = proxyquire('../../gateway/shutdown', {
  process: mockProcess
});


describe('Shutdown', () => {
  afterEach(() => {
    this.spyExit.restore();
    this.spyLog.restore();
    mockProcess.exitCode = 0;
  });
  beforeEach(() => {
    this.spyExit = sinon.spy(mockProcess, 'exit');
    this.spyLog = sinon.spy(console, 'log');
    this.shutdown = new ShutdownManager();
  });

  describe('child', () => {
    it('sets the exit code', () => {
      this.shutdown.childExited(33);
      assert.equal(33, mockProcess.exitCode);
    });

    it('stops only once', () => {
      var spy = sinon.spy();
      this.shutdown.on('stop', spy);
      this.shutdown.childExited(11);
      this.shutdown.childExited(22);
      assert.equal(11, mockProcess.exitCode);
      assert.equal(1, spy.callCount);
    });

    it('triggers a stop event', () => {
      var spy = sinon.spy();
      this.shutdown.on('stop', spy);
      this.shutdown.childExited(22);
      assert.equal(1, spy.callCount);
    });

    it('still requires two signals to kill process', () => {
      this.shutdown.childExited(22);
      this.shutdown.stop();
      assert.equal(0, this.spyExit.callCount);
      this.shutdown.stop();
      assert.equal(1, this.spyExit.callCount);
    });
  });

  describe('signal', () => {
    it('triggers a stop event', () => {
      var spy = sinon.spy();
      this.shutdown.on('stop', spy);
      this.shutdown.stop();
      assert.equal(1, spy.callCount);
    });

    it('logs a stopping message', () => {
      this.shutdown.stop();
      assert.equal(
        '\u001b[33mStopping gracefully, signal again to force exit\u001b[39m',
        this.spyLog.getCall(0).args[0]
      );
    });

    it('kills the process on second signal', () => {
      mockProcess.exitCode = 66;
      this.shutdown.stop();
      this.shutdown.stop();
      assert.equal(
        '\u001b[31mStopping abrubptly now, sorry you had to do that!\u001b[39m',
        this.spyLog.getCall(1).args[0]
      );
      assert.equal(1, this.spyExit.callCount);
      assert.equal(66, mockProcess.exitCode);
    });

    it('kills exit code 1 if prev code is 0', () => {
      mockProcess.exitCode = 0;
      this.shutdown.stop();
      this.shutdown.stop();
      assert.equal(1, mockProcess.exitCode);
    });
  });
});
