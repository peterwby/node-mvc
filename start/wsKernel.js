'use strict'

const Ws = use('Ws')

/*
|--------------------------------------------------------------------------
| Global middleware
|--------------------------------------------------------------------------
|
| Global middleware are executed on each Websocket channel subscription.
|
*/
const globalMiddleware = []

/*
|--------------------------------------------------------------------------
| Named middleware
|--------------------------------------------------------------------------
|
| Named middleware are defined as key/value pairs. Later you can use the
| keys to run selected middleware on a given channel.
|
| // define
| {
|   auth: 'Adonis/Middleware/Auth'
| }
|
| // use
| Ws.channel('chat', 'ChatController').middleware(['auth'])
*/
const namedMiddleware = {
  checkAuth: 'App/Middleware/CheckAuth',
  checkApiAuth: 'App/Middleware/CheckApiAuth',
  checkViewAuth: 'App/Middleware/CheckViewAuth',
}

Ws.registerGlobal(globalMiddleware).registerNamed(namedMiddleware)
