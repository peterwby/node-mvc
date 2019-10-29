'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')
const log = use('Logger')

//需验证
Route.group(() => {
  try {
    Route.get('show-menu', 'MenuController.show')
  } catch (err) {
    log.err(err)
    return {
      code: 9999,
      msg: '服务端无此路由',
      data: null,
    }
  }
})
  .prefix('api/v1')
  .middleware(['checkAuth'])

//无需验证
Route.group(() => {
  try {
    Route.post('login-member', 'MemberController.login')
    Route.post('create-member', 'MemberController.create')
  } catch (err) {
    log.err(err)
    return {
      code: 9999,
      msg: '服务端无此路由',
      data: null,
    }
  }
}).prefix('api/v1')

Route.group(() => {
  try {
    Route.post('fetch-prod', 'PC/TestController.fetchProd')
  } catch (err) {
    log.err(err)
    return {
      code: 9999,
      msg: '服务端无此路由',
      data: null,
    }
  }
})
  .prefix('task-api/v1')
  .middleware(['checkAuthByRedis'])

//以下为测试路由，可删除===================
Route.get('/test', 'PC/TestController.test')
Route.get('/test2', 'PC/TestController.test2')

//如果匹配不到路由，则转到404页面
//Route.any('*', ({ view }) => view.render('404'))
Route.any('*', () => {
  return {
    code: 9999,
    msg: '服务端无此路由',
    data: null,
  }
})
