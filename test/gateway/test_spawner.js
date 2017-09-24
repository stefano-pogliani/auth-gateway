const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const { ShutdownManager } = require('../../gateway/shutdown');

// Mocks are configured in beforeEach.
let mockChild = {
  stderr: {},
  stdout: {},
  kill: null
};
let mockChildProcess = {};
let mockFile = {name: 'tmp'};
let mockFs = {};
let mockProcess = {};
let mockShutdown = {
  ShutdownManager: ShutdownManager,
  shutdown: {
    childExited: sinon.spy(),
    once: sinon.spy(),
    removeListener: sinon.spy()
  }
};
let mockTmp = {};

const { Spawner } = proxyquire('../../gateway/spawner', {
  child_process: mockChildProcess,
  fs: mockFs,
  process: mockProcess,
  tmp: mockTmp,
  './shutdown': mockShutdown
});


describe('Spawner', () => {
  beforeEach(() => {
    mockChild.on = sinon.spy();
    mockChild.stderr.on = sinon.spy();
    mockChild.stdout.on = sinon.spy();
    mockChild.kill = sinon.spy();
    mockChildProcess.spawn = sinon.stub().returns(mockChild);
    mockFs.writeFileSync = sinon.spy();
    mockProcess.exit = sinon.spy();
    mockShutdown.shutdown.childExited = sinon.spy();
    mockShutdown.shutdown.once = sinon.spy();
    mockShutdown.shutdown.removeListener = sinon.spy();
    mockTmp.fileSync = sinon.stub().returns(mockFile);
  });

  describe('construct', () => {
    it('with defaults', () => {
      let child = new Spawner('test-child', 'bash');
      assert(child instanceof Spawner);
      assert.equal('test-child', child.name());
      assert.equal('bash', child._command);
      assert.equal(null, child._makeConfig);
      assert.equal(null, child._tmpFile);
      assert.deepEqual([], child._args);
      assert.equal('abc', child._tagLine('abc'));
    });

    it('with options', () => {
      let child = new Spawner('test-child', 'bash', {
        args: ['a', 'b', 'c'],
        configFlag: '-c',
        makeConfig: () => ''
      });
      assert(child instanceof Spawner);
      assert.equal('test-child', child.name());
      assert.equal('bash', child._command);
      assert.notEqual(null, child._makeConfig);
      assert.deepEqual(['a', 'b', 'c', '-c', 'tmp'], child._args);
    });

    it('append config', () => {
      let child = new Spawner('test-child', 'bash', {
        makeConfig: () => ''
      });
      assert.deepEqual(['tmp'], child._args);
    });
  });

  describe('spawn', () => {
    beforeEach(() => {
      this.child = new Spawner('test-child', 'bash');
      this.child.spawn();
    });

    it('fails if run twice', () => {
      assert.throws(() => this.child.spawn(), Error);
    });

    it('renders the config file', () => {
      let child = new Spawner('test-child', 'bash', {
        makeConfig: () => 'ABCD',
        output: () => {}
      });
      child.spawn();
      assert(mockFs.writeFileSync.calledWith('tmp', 'ABCD'));
    });

    it('skips config rendering', () => {
      assert(!mockFs.writeFileSync.called);
    });

    it('starts a child', () => {
      assert(mockChildProcess.spawn.calledWith(
        'bash', this.child._args, {stdio: ['ignore', 'pipe', 'pipe']}
      ));
    });

    it('binds to error and exit event', () => {
      assert(mockChild.on.calledWith('error'));
      assert(mockChild.on.calledWith('exit'));
    });

    it('binds to stderr and stdout event', () => {
      assert(mockChild.stderr.on.calledWith('data'));
      assert(mockChild.stdout.on.calledWith('data'));
    });

    it('binds to system shutdown', () => {
      assert(mockShutdown.shutdown.once.calledWith('stop'));
    });
  });

  describe('exit', () => {
    beforeEach(() => {
      this.output = sinon.spy();
      this.child = new Spawner('test-child', 'bash', {
        tagLine: (msg) => '[' + msg + '] ',
        output: this.output
      });
      this.child.spawn();
    });

    it('prints the error and exits', () => {
      this.child._onError(new Error('abc'));
      const msg = this.output.firstCall.args[0];
      assert.equal('[test-child] Child emitted an error: Error: abc', msg);
      assert.equal(1, mockShutdown.shutdown.childExited.callCount);
      assert.equal(0, mockProcess.exit.callCount);
    });

    it('removes the shutdown listener on error', () => {
      this.child._onError(new Error('abc'));
      assert(mockShutdown.shutdown.removeListener.calledWith(
        'stop', this.child._onSystemStop
      ));
    });

    it('prints the exit code and signal and exits', () => {
      this.child._onExit(22, 'SIGINT');
      const msg = this.output.firstCall.args[0];
      assert.equal('[test-child] Exited with code 22 because of SIGINT', msg);
      assert(mockShutdown.shutdown.childExited.calledWith(22));
      assert.equal(0, mockProcess.exit.callCount);
    });

    it('prints the exit code only and exits', () => {
      this.child._onExit(23, null);
      const msg = this.output.firstCall.args[0];
      assert.equal('[test-child] Exited with code 23', msg);
      assert(mockShutdown.shutdown.childExited.calledWith(23));
      assert.equal(0, mockProcess.exit.callCount);
    });

    it('removes the shutdown listener on exit', () => {
      this.child._onExit(23, null);
      assert(mockShutdown.shutdown.removeListener.calledWith(
        'stop', this.child._onSystemStop
      ));
    });
  });

  describe('output', () => {
    beforeEach(() => {
      this.output = sinon.spy();
      this.child = new Spawner('test-child', 'bash', {
        tagLine: (msg) => '[' + msg + '] ',
        output: this.output
      });
      this.child.spawn();
    });

    it('buffers chunks without new-lines', () => {
      this.child._onOutput('abc');
      this.child._onOutput('def', true);
      assert(!this.output.called);
      assert.equal('abc', this.child._bufferStdout);
      assert.equal('def', this.child._bufferStderr);
    });

    it('outputs lines and buffers as soon as possible', () => {
      this.child._onOutput('abc');
      this.child._onOutput('def', true);
      assert(!this.output.called);
      this.child._onOutput('g\nh\ni');
      this.child._onOutput('j\nk\nl', true);
      assert.equal(4, this.output.callCount);
      assert.equal('i', this.child._bufferStdout);
      assert.equal('l', this.child._bufferStderr);
    });

    it('flushes buffer on error', () => {
      this.child._onOutput('abc');
      this.child._onOutput('def', true);
      this.child._onError(new Error('abc'));
      assert.equal(3, this.output.callCount);
    });

    it('flushes buffer on exit', () => {
      this.child._onOutput('abc');
      this.child._onOutput('def', true);
      this.child._onExit(22, 'SIGINT');
      assert.equal(3, this.output.callCount);
    });
  });

  describe('bindings', () => {
    beforeEach(() => {
      this.output = sinon.spy();
      this.child = new Spawner('test-child', 'bash', {
        tagLine: (msg) => '[' + msg + '] ',
        output: this.output
      });
      this.child.spawn();
    });

    it('call onError', () => {
      const onError = mockChild.on.firstCall.args[1];
      this.child._onError = sinon.spy();
      onError('abc');
      assert(this.child._onError.calledWith('abc'));
    });

    it('call onExit', () => {
      const onExit = mockChild.on.secondCall.args[1];
      this.child._onExit = sinon.spy();
      onExit(22, 'abc');
      assert(this.child._onExit.calledWith(22, 'abc'));
    });

    it('call stderr onData', () => {
      const onData = mockChild.stderr.on.firstCall.args[1];
      this.child._onOutput = sinon.spy();
      onData('abc');
      assert(this.child._onOutput.calledWith('abc', true));
    });

    it('call stdout onData', () => {
      const onData = mockChild.stdout.on.firstCall.args[1];
      this.child._onOutput = sinon.spy();
      onData('abc');
      assert(this.child._onOutput.calledWith('abc', false));
    });

    it('call onSystemStop', () => {
      const onStop = mockShutdown.shutdown.once.firstCall.args[1];
      this.child._proc = {kill: sinon.spy()};
      onStop();
      assert.equal(1, this.child._proc.kill.callCount);
    });
  });

  describe('logrotate', () => {
    it('does nothing without a signal', () => {
      this.child = new Spawner('test-child', 'bash', {
        output: sinon.spy()
      });
      this.child.spawn();
      const signaled = this.child.logrotate();
      assert.equal(false, signaled);
      assert.equal(0, mockChild.kill.callCount);
    });

    it('signals the child', () => {
      this.child = new Spawner('test-child', 'bash', {
        logrotateSignal: 'SIGUSR1',
        output: sinon.spy()
      });
      this.child.spawn();
      const signaled = this.child.logrotate();
      assert.equal(true, signaled);
      assert(mockChild.kill.calledWith('SIGUSR1'));
    });
  });

  describe('reload', () => {
    it('does nothing without a signal', () => {
      this.child = new Spawner('test-child', 'bash', {
        output: sinon.spy()
      });
      this.child.spawn();
      const signaled = this.child.reload();
      assert.equal(false, signaled);
      assert.equal(0, mockChild.kill.callCount);
    });

    it('signals the child', () => {
      this.child = new Spawner('test-child', 'bash', {
        reloadSignal: 'SIGHUP',
        output: sinon.spy()
      });
      this.child.spawn();
      const signaled = this.child.reload();
      assert.equal(true, signaled);
      assert(mockChild.kill.calledWith('SIGHUP'));
    });
  });
});
