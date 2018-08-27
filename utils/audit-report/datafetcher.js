const dateFormat = require('dateformat');

const DATE_FORMAT = 'dddd, mmmm dS, yyyy';
const MILLISECS_IN_DAY = 24 * 60 * 60 * 1000;
module.exports.MILLISECS_IN_DAY = MILLISECS_IN_DAY;

/**
 * Promise-based collection.aggregate.
 */
const promiseAggregate = (collection, pipeline) => {
  return new Promise((resolve, reject) => {
    collection.aggregate(pipeline, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  }).then((results) => results.toArray());
};


/**
 * Fetches aggregated data from MongoDB and returns it
 * as a structured conext for rendering.
 */
module.exports.fetch = (collection, start_time, end_time) => {
  const timestamp = {$gte: start_time};
  const filter_time = {timestamp: timestamp};

  // Run all queries in parallel (could overload MongoDB).
  const users = collection.distinct('email', filter_time);
  const sessions = collection.distinct('session_id', filter_time);
  const req_allowed = collection.countDocuments({
    result: 'allow',
    timestamp: timestamp
  });
  const req_denied = collection.countDocuments({
    result: {$ne: 'allow'},
    timestamp: timestamp
  });
  const unkown_allowed = collection.countDocuments({
    session_id: null,
    result: 'allow',
    timestamp: timestamp,
    whitelisted: false
  });
  const unkown_total = collection.countDocuments({
    session_id: null,
    timestamp: timestamp,
    whitelisted: false
  });

  // Have MongoDB compute a per-day histogram of allowed/rejected.
  const day = {$floor: {$divide: ['$timestamp', MILLISECS_IN_DAY]}};
  const histogram = promiseAggregate(collection, [
    {$match: filter_time},
    {$group: {
      _id: day,
      allowed: {$sum: {$cond: {
        if: {$eq: ['$result', 'allow']},
        then: 1,
        else: 0
      }}},
      denied: {$sum: {$cond: {
        if: {$ne: ['$result', 'allow']},
        then: 1,
        else: 0
      }}}
    }}
  ]).then((histogram) => {
    // Convert _id into days.
    histogram.forEach((bucket) => {
      bucket.date = new Date(bucket._id * MILLISECS_IN_DAY);
      bucket.formatted_date = dateFormat(bucket.date, DATE_FORMAT);
      delete bucket._id;
    });
    return histogram.sort((left, right) => {
      return left.date.getTime() - right.date.getTime();
    });
  });

  // Collect and format all the results.
  return Promise.all([
    users,
    sessions,
    req_allowed,
    req_denied,
    unkown_allowed,
    unkown_total,
    histogram
  ]).then((results) => {
    const formatted_end = (new Date(end_time)).toLocaleString();
    const formatted_start = (new Date(start_time)).toLocaleString();
    return {
      meta: {
        formatted_end: formatted_end,
        formatted_start: formatted_start,
        title: `AuthGateway Access Report - ${formatted_start}`
      },
      report: {
        users: results[0].sort(),
        sessions: results[1].length,
        histogram: results[6],
        requests: {
          allowed: results[2],
          denied: results[3]
        },
        unkown: {
          allowed: results[4],
          total: results[5]
        }
      }
    };
  });
};
