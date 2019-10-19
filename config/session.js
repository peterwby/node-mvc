'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | Session Driver
  |--------------------------------------------------------------------------
  |
  | The session driver to be used for storing session values. It can be
  | cookie, file or redis.
  |
  | For `redis` driver, make sure to install and register `@adonisjs/redis`
  |
  */
  driver: Env.get('SESSION_DRIVER', 'cookie'),

  /*
  |--------------------------------------------------------------------------
  | Cookie Name
  |--------------------------------------------------------------------------
  |
  | The name of the cookie to be used for saving session id. Session ids
  | are signed and encrypted.
  |
  */
  cookieName: 'sessionid',

  /*
  |--------------------------------------------------------------------------
  | Clear session when browser closes
  |--------------------------------------------------------------------------
  |
  | If this value is true, the session cookie will be temporary and will be
  | removed when browser closes.
  |
  */
  clearWithBrowser: false,

  /*
  |--------------------------------------------------------------------------
  | Session age
  |--------------------------------------------------------------------------
  |
  | This value is only used when `clearWithBrowser` is set to false. The
  | age must be a valid https://npmjs.org/package/ms string or should
  | be in milliseconds.
  |
  | Valid values are:
  |  '2h', '10d', '5y', '2.5 hrs'
  |
  */
  age: '1d',

  /*
  |--------------------------------------------------------------------------
  | Cookie options
  |--------------------------------------------------------------------------
  |
  | Cookie options defines the options to be used for setting up session
  | cookie
  |
  */
  cookie: {
    httpOnly: true,
    sameSite: false,
    path: '/',
  },

  /*
  |--------------------------------------------------------------------------
  | Sessions location
  |--------------------------------------------------------------------------
  |
  | If driver is set to file, we need to define the relative location from
  | the temporary path or absolute url to any location.
  |
  */
  file: {
    location: 'sessions',
  },

  /*
  |--------------------------------------------------------------------------
  | Redis config
  |--------------------------------------------------------------------------
  |
  | The configuration for the redis driver. By default we reference it from
  | the redis file. But you are free to define an object here too.
  |
  */
  redis: {
    host: '119.23.47.115',
    port: 6379,
    password: '7tl9vYpHe0eYk9tYdXsLgXPxqm1XwPfMQS7h0mRUH5i5Mtm12QLHb92MRA7lU6Fqk0GtcJXzoi8ivHJhWjEfc7iye2cK797srqJfYezFCoCgKgGnJLN7tOkjyJwHJTOI',
    db: 0,
    keyPrefix: '',
  },
}
