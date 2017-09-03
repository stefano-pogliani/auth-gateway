const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const mockRequest = sinon.spy();
const {
  HttpAuditor
} = proxyquire('../../../../gateway/server/auditor/http', {
  request: mockRequest
});


describe('Server', () => {
  describe('Auditor', () => {
    describe('Http', () => {
      afterEach(() => {
        mockRequest.reset();
      });

      const simulateRequest = () => {
        const auditor = new HttpAuditor({
          endpoint: 'https://localhost:1234/authgateway/audit'
        });
        const req = auditor.audit({});
        const handler = mockRequest.getCall(0).args[1];
        return {
          auditor: auditor,
          handler: handler,
          req: req
        };
      };

      it('requires an endpoint', () => {
        const maker = () => new HttpAuditor({});
        assert.throws(maker, Error);
      });

      it('pushes the request', () => {
        const { req, handler } = simulateRequest();
        assert.deepEqual(mockRequest.getCall(0).args[0], {
          body: {},
          json: true,
          method: 'POST',
          url: 'https://localhost:1234/authgateway/audit'
        });
        handler(null, {statusCode: 200});
        return req.then((status) => {
          assert.equal(null, status);
        });
      });

      it('denys request on error', () => {
        const { req, handler } = simulateRequest();
        handler(new Error('abc'), null);
        return req.then((status) => {
          assert.equal(500, status);
        });
      });

      it('denys request on !2xx response', () => {
        const { req, handler } = simulateRequest();
        handler(null, {statusCode: 404});
        return req.then((status) => {
          assert.equal(500, status);
        });
      });

      it('denys request on callback error', () => {
        const { req, handler } = simulateRequest();
        handler(null, null);
        return req.then((status) => {
          assert.equal(500, status);
        });
      });
    });
  });
});
