/**
 * Returns a formatted audit record for reports.
 *
 * The primary aim of this method is to ensure that all
 * attributes of an audit record are set correctly across
 * all possible allow/reject paths.
 *
 * @param req {Object} The request being processed.
 * @param session {Object} The session attached to the request.
 * @param result {Object} The result of the operation.
 * @param protocol {String} The protocol used to reach the gateway.
 * @param time {Number} The time the request was processed.
 *
 * @returns {Object} The audit record for the request.
 */
module.exports.AuditRecord = (req, session, result, protocol, time) => {
  const host = req.get('Host');
  const proto = req.get('X-Forwarded-Proto');
  const uri = req.get('X-Original-URI');
  const original_url = `${proto}://${host}${uri}`;
  return {
    email: session.email,
    protocol: 'https',
    resource: original_url,
    reason: result.reason,
    result: result.allowed ? 'allow' : 'deny',
    session_id: session.id,
    timestamp: time,
    user: session.user,
    whitelisted: result.whitelisted
  };
};
