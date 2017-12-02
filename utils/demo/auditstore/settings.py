# Global conf.
ALLOWED_FILTERS = []
HATEOAS = False
JSON_SORT_KEYS = True
OPTIMIZE_PAGINATION_FOR_SPEED = True
VALIDATE_FILTERS = True
XML = False


# Mongo conf.
MONGO_DBNAME = 'authgateway'
MONGO_HOST = 'localhost'
MONGO_PORT = 27017


# Data model.
DOMAIN = {
  'audit': {
    'datasource': {
      'default_sort': [('timestamp', -1)]
    },
    'resource_methods': ['GET', 'POST'],
    'schema': {
      'email': {
        'type': 'string',
        'nullable': True,
        'required': True
      },
      'protocol': {
        'type': 'string',
        'required': True
      },
      'resource': {
        'type': 'string',
        'required': True
      },
      'reason': {
        'type': 'string',
        'required': True
      },
      'result': {
        'type': 'string',
        'required': True
      },
      'session_id': {
        'type': 'string',
        'nullable': True,
        'required': True
      },
      'timestamp': {
        'type': 'integer',
        'required': True
      },
      'user': {
        'type': 'string',
        'nullable': True,
        'required': True
      },
      'whitelisted': {
        'type': 'boolean',
        'required': True
      }
    }
  }
}
