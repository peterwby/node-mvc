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

/****************************
 * 考核时用下面的路由组
 ****************************/
Route.group(() => {
  try {
    Route.get('redis', 'PC/TestController.testRedis')
    //Route.get('xxx', 'PC/xxx')
  } catch (err) {
    return Util.end2front({
      msg: '服务端无此路由',
      code: 9999,
    })
  }
}).prefix('test')

/****************************
 * demo
 ****************************/

Route.group(() => {
  Route.get('heart', () => 'success')
  Route.get('get-func-info', 'PC/MemberController.getFuncInfo')
  Route.get('get-func-time', 'PC/MemberController.getFuncTime')
}).middleware(['noAuth']) //无需验证组，任何人都能访问

/**
 * 无需验证的接口组
 */
Route.group(() => {
  try {
    Route.post('member/login', 'PC/MemberController.login')
  } catch (err) {
    return Util.end2front({
      msg: 'Not found the API',
      code: 9990,
    })
  }
})
  .prefix('api/v1')
  .middleware(['noAuth']) //无需验证组，任何人都能访问

/**
 * 需要进行身份验证（用session来判断）
 */
Route.group(() => {
  try {
    //菜单
    Route.post('menu/get-menu', 'PC/MenuController.getMenu')
    //用户
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
      msg: 'Not found the API',
      code: 9991,
    })
  }
})
  .prefix('api/v1') //统一给这组路由的uri加入前缀
  .middleware(['checkAuth']) //验证身份

//需要key验证
Route.group(() => {
  try {
    Route.get('get-func-info', 'PC/MemberController.getFuncInfo')
  } catch (err) {
    return Util.end2front({
      msg: 'Not found the API',
      code: 9992,
    })
  }
})
  .prefix('api') //统一给这组路由的uri加入前缀
  .middleware(['checkAuthByString']) //验证身份

/****************************
 * 服务端模板渲染输出html
 ****************************/

Route.group(() => {
  try {
    Route.post('/save-token', 'html/MemberController.saveToken')
    Route.post('/remove-token', 'html/MemberController.removeToken')

    Route.get('/index', 'html/IndexController.init')
    Route.get('test-login', ({ view }) => view.render('html.test-login'))

    Route.get('*', ({ view, params, request, session, response }) => {
      //前端：如果没登录则跳到登录页
      if (!session.get('token')) {
        return response.redirect('/html/test-login')
      }
      const url = request.url()
      let tpl_src = url.replace(/\//g, '.').replace('.html.', 'html.')

      if (tpl_src.endsWith('.edge')) {
        tpl_src = tpl_src.substring(0, tpl_src.lastIndexOf('.edge'))
      }
      return view.render(tpl_src)
    })
  } catch (err) {
    return view.render('error.404')
  }
})
  .prefix('html')
  .middleware(['htmlGlobal']) //中间件，用于定义模板的公共变量

//兜底：如果都匹配不到路由，则转到404页面
//Route.any('*', ({ view }) => view.render('error.404'))
Route.any('*', () => {
  return Util.end2front({
    msg: 'Not found the API',
    code: 9999,
  })
})
