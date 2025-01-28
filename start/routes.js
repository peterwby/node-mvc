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
const Util = require('@Lib/Util')
const Generator = require('../app/Generator')
const generator = new Generator()

// 刷新翻译数据
const CommonService = require(`@Services/CommonService`)
const commonService = new CommonService()
commonService.refreshCurrentLanguage()

// 教程示例路由
Route.group(() => {
  //基础语法
  //http://127.0.0.1:3000/tutorial/js-basics
  Route.get('js-basics', 'TutorialController.jsBasics')
  //数据库查询
  //http://127.0.0.1:3000/tutorial/db-select
  Route.get('db-select', 'TutorialController.dbSelect')
  //数据库修改
  //http://127.0.0.1:3000/tutorial/db-modify
  Route.post('db-modify', 'TutorialController.dbModify')
  //http请求
  Route.get('httpRequest', 'TutorialController.httpRequest')
  //redis操作
  Route.get('redis-ops', 'TutorialController.redisOps')
  //文件操作
  Route.get('file-ops', 'TutorialController.fileOps')
})
  .prefix('tutorial')
  .middleware(['noAuth'])

Route.group(() => {
  Route.get('heart', () => 'success')
}).middleware(['noAuth']) //无需验证组，任何人都能访问

Route.group(() => {
  Route.get('get-func-info', 'MemberController.getFuncInfo')
  Route.get('get-func-time', 'MemberController.getFuncTime')
}).middleware(['checkAuthByString'])

Route.group(() => {
  try {
    Route.post('member/sign-in', 'MemberController.signIn')
    Route.post('member/sign-up', 'MemberController.signUp')
    Route.post('get-translation', 'CommonController.getTranslation')
  } catch (err) {
    return Util.end2front({
      msg: 'Not found the API',
      code: 9990,
    })
  }
})
  .prefix('api')
  .middleware(['noAuth']) //无需验证组，任何人都能访问

/**
 * 需要进行身份验证（用session来判断）
 */
Route.group(() => {
  try {
    //通用
    Route.post('upload/image', 'CommonController.uploadImage')
    //用户
    Route.post('member/get-list', 'MemberController.getList')
    Route.post('member/logout', 'MemberController.logout')
    Route.post('member/update-password', 'MemberController.updatePassword')
    Route.post('member/update-info', 'MemberController.updateInfo')
    Route.post('member/create-info', 'MemberController.createInfo')
    Route.post('member/remove', 'MemberController.remove')
  } catch (err) {
    return Util.end2front({
      msg: 'Not found the API',
      code: 9991,
    })
  }
})
  .prefix('api') //统一给这组路由的uri加入前缀
  .middleware(['checkApiAuth']) //验证身份

// View层 - 需要验证身份的路由
Route.group(() => {
  try {
    Route.get('/', 'HomeController.home')
    Route.get('member/list', 'MemberController.list')
    Route.get('member/view/:member_id', 'MemberController.view')
    Route.get('member/edit/:member_id', 'MemberController.edit')
    Route.post('member/edit-password', 'MemberController.updatePassword')
    Route.post('member/edit-info', 'MemberController.editInfo')
    Route.get('member/create', 'MemberController.create')
    Route.post('member/logout', 'MemberController.logout')
  } catch (err) {
    return Util.end2front({
      msg: 'Not found the API',
      code: 9992,
    })
  }
})
  .prefix('admin')
  .middleware(['checkViewAuth'])

// View层 - 无需验证身份的路由
Route.group(() => {
  try {
    Route.get('sign-in', 'AuthController.signIn')
    Route.get('sign-up', 'AuthController.signUp')
  } catch (err) {
    return Util.end2front({
      msg: 'Not found the API',
      code: 9993,
    })
  }
})
  .prefix('admin/auth')
  .middleware(['noAuth'])

// 代码生成工具
Route.group(() => {
  try {
    Route.get('tool', async ({ view, session }) => {
      // 检查是否超级管理员

      const member = session.get('member')
      if (!member || member.member_id !== 1) {
        return view.render('error.404')
      }
      return generator.tool({ view })
    })

    Route.post('generate', async ({ request, response, session }) => {
      // 检查是否超级管理员
      const member = session.get('member')
      console.log('session member', member)
      if (!member || member.member_id !== 1) {
        return Util.end2front({
          msg: '只有超级管理员可以使用此功能',
          code: 9000,
        })
      }
      return generator.generate({ body: request.all(), response })
    })
  } catch (err) {
    return Util.end2front({
      msg: 'Not found the API',
      code: 9994,
    })
  }
}).prefix('generator')

//兜底：如果都匹配不到路由，则转到404页面
//Route.any('*', ({ view }) => view.render('error.404'))
Route.any('*', (ctx) => {
  Util.saveLog(ctx, null, 'error', 'Invalid API route')

  return Util.end2front({
    msg: 'Not found the API',
    code: 9999,
  })
})
