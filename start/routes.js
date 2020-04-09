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
const Util = require('@Lib/Util')

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// XXXX  下面的几个例子，演示基本操作
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

// 访问 http://127.0.0.1:3201/test1，会调用"app/Controllers/Http/PC/TestController.js"的test1()方法，以此类推
Route.get('/test1', 'PC/TestController.test1')
// http://127.0.0.1:3201/test2?uname=peter
Route.get('/test2', 'PC/TestController.test2')
// http://127.0.0.1:3201/test3?fromdate=2019-03-22&todate=2019-04-25&status=1&page=1&limit=3
Route.get('/test3', 'PC/TestController.test3')
Route.get('/test4', 'PC/TestController.test4')
//演示Util工具库的常用操作
Route.get('/test-util', 'PC/TestController.testUtil')
//演示get方法访问外部链接
Route.get('/test-httpget', 'PC/TestController.testGet')
//演示post方法访问外部链接
Route.get('/test-httppost', 'PC/TestController.testPost')
//演示session用法
Route.get('/test-session', 'PC/TestController.testSession')

/**
 * 模板引擎渲染
 * @example
 *
 */
Route.get('/', ({ view }) => view.render('index'))

/**
 * 无需验证的接口组
 */
Route.group(() => {
  try {
    Route.post('member/login', 'PC/MemberController.login')
  } catch (err) {
    return Util.end2front({
      msg: '服务端无此路由',
      code: 9999,
    })
  }
}).prefix('api/v1')

/**
 * 需要进行身份验证（用session来判断）
 */
Route.group(() => {
  try {
    //菜单
    Route.post('menu/get-menu', 'PC/MenuController.getMenu')
    //用户
    Route.post('member/logout', 'PC/MemberController.logout')
    Route.post('member/get-table-common', 'PC/MemberController.getTableCommon')
    Route.post('member/get-table', 'PC/MemberController.getTable')
    Route.post('member/logout', 'PC/MemberController.logout')
    Route.post('member/edit-password', 'PC/MemberController.editPassword')
    Route.post('member/get-edit-common', 'PC/MemberController.getEditCommon')
    Route.post('member/edit', 'PC/MemberController.edit')
    Route.post('member/get-create-common', 'PC/MemberController.getCreateCommon')
    Route.post('member/create', 'PC/MemberController.create')
    Route.post('member/remove', 'PC/MemberController.remove')
  } catch (err) {
    return Util.end2front({
      msg: '服务端无此路由',
      code: 9999,
    })
  }
})
  .prefix('api/v1') //统一给这组路由的uri加入前缀
  .middleware(['checkAuth']) //验证身份

//兜底：如果都匹配不到路由，则转到404页面
//Route.any('*', ({ view }) => view.render('error.404'))
Route.any('*', () => {
  return Util.end2front({
    msg: '服务端无此路由',
    code: 9999,
  })
})
