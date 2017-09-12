use authgateway;

const day = {$floor: {$divide: ["$timestamp", 1000 * 60 * 60 * 24]}};
const histogram = db.audit.aggregate([
  {$group: {
    _id: day,
    allowed: {$sum: {$cond: {if: {$eq: ["$result", "allow"]}, then: 1, else: 0}}},
    denied:  {$sum: {$cond: {if: {$ne: ["$result", "allow"]}, then: 1, else: 0}}}
  }}
]);

const overview = {
  users: db.audit.distinct("email"),
  sessions: db.audit.distinct("session_id").length,
  histogram: histogram,
  requests: {
    allowed: db.audit.count({"result" : "allow"}),
    denied: db.audit.count({"result": {$ne: "allow"}})
  },
  unkown: {
    allowed: db.audit.count({"session_id" : null, "result": "allow"}),
    total: db.audit.count({"session_id" : null})
  }
};
