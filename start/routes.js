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

/**
 * 服务端模板渲染的例子
 * @example
 * 本框架支持服务端渲染生成html，即mvc架构里的view，但在前后端分离的项目里，一般是在客户端渲染的
 */
Route.get('/', ({ view }) => view.render('index'))

//兜底：如果都匹配不到路由，则转到404页面
//Route.any('*', ({ view }) => view.render('error.404'))
Route.any('*', () => {
  return Util.end2front({
    msg: '服务端无此路由',
    code: 9999,
  })
})
