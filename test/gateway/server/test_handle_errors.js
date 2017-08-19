const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const mockApp = {
  use: sinon.spy()
};
proxyquire('../../../gateway/server/handle_errors', {
  './app': {
    app: mockApp,
    logAppMessage: sinon.spy()
  }
});


describe('Server', () => {
  describe('app', () => {
    describe('handle errors', () => {
      it('returns json', () => {
        const err = new Error('abc');
        const handler = mockApp.use.getCall(0).args[0];
        const res = {
          status: sinon.stub(),
          json: sinon.spy()
        };
        res.status.returns(res);
        handler(err, sinon.spy(), res, sinon.spy());
        assert(res.status.calledWith(500));
        assert(res.json.calledWith({error: 'abc'}));
      });
    });
  });
});
