'use strict'

/** @type {import('@adonisjs/framework/src/Server')} */
const Server = use('Server')

/*
|--------------------------------------------------------------------------
| Global Middleware//匹配到路由之后才按顺序执行
|--------------------------------------------------------------------------
|
| Global middleware are executed on each http request only when the routes
| match.
|
*/
const globalMiddleware = ['Adonis/Middleware/BodyParser', 'Adonis/Middleware/Session', 'Adonis/Middleware/Shield', 'App/Middleware/ConvertEmptyStringsToNull']

/*
|--------------------------------------------------------------------------
| Named Middleware
|--------------------------------------------------------------------------
|
| Named middleware is key/value object to conditionally add middleware on
| specific routes or group of routes.
|
| // define
| {
|   auth: 'Adonis/Middleware/Auth'
| }
|
| // use
| Route.get().middleware('auth')
|
*/
const namedMiddleware = {
  checkAuth: 'App/Middleware/CheckAuth',
}

/*
|--------------------------------------------------------------------------
| Server Middleware//在匹配路由之前执行，即不管是否匹配到路由都会执行
|--------------------------------------------------------------------------
|
| Server level middleware are executed even when route for a given URL is
| not registered. Features like `static assets` and `cors` needs better
| control over request lifecycle.
|
*/
const serverMiddleware = ['Adonis/Middleware/Static', 'Adonis/Middleware/Cors']

Server.registerGlobal(globalMiddleware)
  .registerNamed(namedMiddleware)
  .use(serverMiddleware)
