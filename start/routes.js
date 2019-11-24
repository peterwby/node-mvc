'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| 数据的流转过程：前端发来请求->Router->Controllers->Services->Models
|
| 本页即是Router，用来接收前端的请求。
| 1、对外提供api接口，对内绑定相应的Controller
| 2、对前端的身份进行验证
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')
const log = use('Logger')
const Util = require('../app/Lib/Util')

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// XXXX  下面是3个例子，由浅入深的演示此框架的使用    XXXX
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

/**
 * 访问http://127.0.0.1:3201/test1，会调用"app/Controllers/Http/PC/TestController.js"的test1()方法，以此类推
 */
Route.get('/test1', 'PC/TestController.test1')
// http://127.0.0.1:3201/test2?uname=peter
Route.get('/test2', 'PC/TestController.test2')
//http://127.0.0.1:3201/test3?fromDate=2019-03-22&toDate=2019-04-25&status=1&page=1&limit=3
Route.get('/test3', 'PC/TestController.test3')
//演示数组字符串等常用操作
Route.get('/testUtil', 'PC/TestController.testUtil')
//演示get方法访问外部链接
Route.get('/testGet', 'PC/TestController.testGet')
//演示post方法访问外部链接
Route.get('/testPost', 'PC/TestController.testPost')

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// XXXX       以下是正式环境常用的路由设置       XXXX
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

/**
 * 一组路由：里面所有url都需要进行身份验证（用session来判断）
 */
Route.group(() => {
  try {
    Route.get('a-test1', 'PC/UserController.showUserList')
    Route.post('a-test2', 'PC/UserController.createUser')
    Route.post('a-test3', 'PC/UserController.deleteUser')
  } catch (err) {
    return Util.end2front({
      msg: '服务端无此路由',
      code: 9999,
    })
  }
})
  .prefix('api/v1') //统一给这组路由的uri加入前缀
  .middleware(['checkAuth']) //验证身份

/**
 * 一组路由：里面所有url都需要进行身份验证（用redis来判断）
 * 通常用在内部跨项目之间的调用，调用方在redis存一个变量，被调用方检查是否存在这个变量，以此证明是可信任的
 */
Route.group(() => {
  try {
    Route.post('b-test', 'PC/TestController.createUser')
  } catch (err) {
    log.err(err)
    return Util.end2front({
      msg: '服务端无此路由',
      code: 9999,
    })
  }
})
  .prefix('inner-api/v1')
  .middleware(['checkAuthByRedis'])

//兜底：如果都匹配不到路由，则转到404页面
//Route.any('*', ({ view }) => view.render('404'))
Route.any('*', () => {
  return Util.end2front({
    msg: '服务端无此路由',
    code: 9999,
  })
})
