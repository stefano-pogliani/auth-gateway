import dateFormat from 'dateformat';

const DATE_FORMAT = 'dddd, mmmm dS, yyyy';

export const MILLISECS_IN_DAY = 24 * 60 * 60 * 1000;

/**
 * Fetches aggregated data from MongoDB and returns it
 * as a structured conext for rendering.
 */
export const fetch = async (collection, start_time, end_time, report_title) => {
  const title = report_title || 'AuthGateway Access Report';
  const timestamp = {$gte: start_time};
  const filter_time = {timestamp: timestamp};

  // Run all queries in parallel (could overload MongoDB).
  const users = collection.distinct('user_id', filter_time);
  const sessions = collection.distinct('session_id', filter_time);
  const allowed = collection.countDocuments({
    reason: 'allowed',
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
  const preauth_allowed = collection.countDocuments({
    reason: 'pre-auth-allowed',
    result: 'allowed',
    timestamp: timestamp
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
        if: {
          $and: [
            {$eq: ['$reason', 'allowed']},
            {$eq: ['$result', 'allowed']},
          ]
        },
        then: 1,
        else: 0
      }}},
      denied: {$sum: {$cond: {
        if: {$ne: ['$result', 'allowed']},
        then: 1,
        else: 0
      }}},
      preauth_allowed: {$sum: {$cond: {
        if: {
          $and: [
            {$eq: ['$reason', 'pre-auth-allowed']},
            {$eq: ['$result', 'allowed']},
          ]
        },
        then: 1,
        else: 0
      }}},
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
    preauth_allowed,
    invalid_allowed,
    invalid_total,
    histogram
  ]);
  const r_users = results[0];
  const r_sessions = results[1];
  const r_allowed = results[2];
  const r_denied = results[3];
  const r_preauth_allowed = results[4];
  const r_invalid_allowed = results[5];
  const r_invalid_total = results[6];
  const r_histogram = results[7];

  // Structure the result into a formattable report.
  const formatted_end = (new Date(end_time)).toLocaleString();
  const formatted_start = (new Date(start_time)).toLocaleString();
  return {
    meta: {
      formatted_end: formatted_end,
      formatted_start: formatted_start,
      title: `${title} - ${formatted_start}`
    },
    report: {
      users: r_users.sort(),
      sessions: r_sessions.sort(),
      histogram: r_histogram,
      requests: {
        allowed: r_allowed,
        denied: r_denied,
        preauth_allowed: r_preauth_allowed,
        total: r_allowed + r_denied + r_preauth_allowed
      },
      invalid: {
        allowed: r_invalid_allowed,
        total: r_invalid_total
      }
    }
  };
};
