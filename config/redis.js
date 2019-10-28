'use strict'

/*
|--------------------------------------------------------------------------
| Redis Configuaration
|--------------------------------------------------------------------------
|
| Here we define the configuration for redis server. A single application
| can make use of multiple redis connections using the redis provider.
|
*/

const Env = use('Env')

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | connection
  |--------------------------------------------------------------------------
  |
  | Redis connection to be used by default.
  |
  */
  connection: Env.get('REDIS_CONNECTION', 'local'), //local内容在下面设置

  /*
  |--------------------------------------------------------------------------
  | local connection config
  |--------------------------------------------------------------------------
  |
  | Configuration for a named connection.
  |
  */
  local: {
    host: '119.23.47.115',
    port: 6379,
    password: '7tl9vYpHe0eYk9tYdXsLgXPxqm1XwPfMQS7h0mRUH5i5Mtm12QLHb92MRA7lU6Fqk0GtcJXzoi8ivHJhWjEfc7iye2cK797srqJfYezFCoCgKgGnJLN7tOkjyJwHJTOI',
    db: 0,
    keyPrefix: '',
  },

  production: {
    host: '',
    port: 6379,
    password: '',
    db: 0,
    keyPrefix: '',
  },

  /*
  |--------------------------------------------------------------------------
  | cluster config
  |--------------------------------------------------------------------------
  |
  | Below is the configuration for the redis cluster.
  |
  */
  cluster: {
    clusters: [
      {
        host: '127.0.0.1',
        port: 6379,
        password: null,
        db: 0,
      },
      {
        host: '127.0.0.1',
        port: 6380,
        password: null,
        db: 0,
      },
    ],
  },
}
