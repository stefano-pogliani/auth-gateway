const dateFormat = require('dateformat');

const DATE_FORMAT = 'dddd, mmmm dS, yyyy';
const MILLISECS_IN_DAY = 24 * 60 * 60 * 1000;
module.exports.MILLISECS_IN_DAY = MILLISECS_IN_DAY;


/**
 * Fetches aggregated data from MongoDB and returns it
 * as a structured conext for rendering.
 */
module.exports.fetch = async (collection, start_time, end_time) => {
  const timestamp = {$gte: start_time};
  const filter_time = {timestamp: timestamp};

  // Run all queries in parallel (could overload MongoDB).
  const users = collection.distinct('user_id', filter_time);
  const sessions = collection.distinct('session_id', filter_time);
  const allowed = collection.countDocuments({
    result: 'allowed',
    timestamp: timestamp
  });
  const denied = collection.countDocuments({
    result: {$ne: 'allowed'},
    timestamp: timestamp
  });
  const invalid_allowed = collection.countDocuments({
    session_id: null,
    reason: 'invalid-session',
    result: 'allowed',
    timestamp: timestamp
  });
  const invalid_total = collection.countDocuments({
    session_id: null,
    reason: 'invalid-session',
    timestamp: timestamp,
  });

  // Have MongoDB compute a per-day histogram of allowed/rejected.
  const histogram_pipeline = [
    // Find documents based on the time filter.
    {$match: filter_time},

    // Bucket all matching documents to the day.
    // The $dateTrunc operator is very new so for now break the date up and recombine it.
    {$set: {
      timestamp: {$dateToParts: {'date': '$timestamp'}}
    }},
    {$set: {
      timestamp: {$dateFromParts: {
        'year': '$timestamp.year',
        'month': '$timestamp.month',
        'day': '$timestamp.day'
      }}
    }},

    // Aggregate daily statistics.
    {$group: {
      _id: '$timestamp',
      allowed: {$sum: {$cond: {
        if: {$eq: ['$result', 'allowed']},
        then: 1,
        else: 0
      }}},
      denied: {$sum: {$cond: {
        if: {$ne: ['$result', 'allowed']},
        then: 1,
        else: 0
      }}}
    }},
  ];
  let histogram = await collection.aggregate(histogram_pipeline);
  histogram = await histogram.toArray();
  histogram = histogram.map((bucket) => {
    bucket.date = bucket._id;
    bucket.formatted_date = dateFormat(bucket.date, DATE_FORMAT);
    delete bucket._id;
    return bucket;
  });
  histogram.sort((left, right) => {
    return left.date.getTime() - right.date.getTime();
  });

  // Collect and format all the results.
  const results = await Promise.all([
    users,
    sessions,
    allowed,
    denied,
    invalid_allowed,
    invalid_total,
    histogram
  ]);
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
      invalid: {
        allowed: results[4],
        total: results[5]
      }
    }
  };
};
