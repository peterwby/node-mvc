'use strict'

/*
|--------------------------------------------------------------------------
| Hashids Configuaration
|--------------------------------------------------------------------------
|
| Here we define the configuration for hashids. A single application
| can make use of multiple hashids connections using the hashids provider.
|
*/

const Env = use('Env')

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | Default Connection Name
  |--------------------------------------------------------------------------
  |
  | Here you may specify which of the connections below you wish to use as
  | your default connection for all work. Of course, you may use many
  | connections at once.
  |
  */

  connection: Env.get('HASHIDS_CONNECTION', 'default'),

  /*
  |--------------------------------------------------------------------------
  | Hashids Connections
  |--------------------------------------------------------------------------
  |
  | Here are each of the connections setup for your application. Example
  | configuration has been included, but you may add as many connections as
  | you would like.
  |
  */

  default: {
    salt: Env.get('APP_KEY', '340w9rfJ'),
    length: 0,
    alphabet: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
  },

  alternative: {
    salt: 'your-salt-string',
    length: 'your-length-integer',
    alphabet: 'your-alphabet-string',
  },
}
