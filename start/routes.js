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
const Logger = use('Logger')

//需验证
Route.group(() => {
  try {
    //Layui菜单
    Route.get('show-menu', 'MenuController.show')

    //用户
    Route.get('logout-member', 'MemberController.logout')

    //公司
    Route.get('show-entity-list-table', 'EntityController.showListTable')
    Route.get('show-entity-list-common', 'EntityController.showListCommon')
    Route.get('show-entity-create-common', 'EntityController.showCreateCommon')
    Route.get('show-entity-edit-common', 'EntityController.showEditCommon')
    //Route.post('delete-entity', 'EntityController.delete')
    Route.post('create-entity', 'EntityController.create')
    //Route.post('update-entity', 'EntityController.update')

    //项目
    Route.get('show-project-list-table', 'ProjectController.showListTable')
    Route.get('show-project-joinmember-common', 'ProjectController.joinMemberCommon')
    Route.get('show-project-joinmember-table', 'ProjectController.joinMemberTable')
    Route.get('show-project-create-common', 'ProjectController.showCreateCommon')
    Route.get('show-project-edit-common', 'ProjectController.showEditCommon')
    Route.post('create-project', 'ProjectController.create')
    Route.post('update-project', 'ProjectController.update')
    Route.post('joinmember-project', 'ProjectController.joinMember')
    Route.post('is-exist-member', 'ProjectController.isExistMember')
    Route.post('update-project-member-role', 'ProjectController.updateMemberRole')
    Route.post('disabled-project-member', 'ProjectController.disabledMember')
    Route.post('enable-project-member', 'ProjectController.enableMember')

    //需求
    Route.get('show-request-list-table', 'RequestController.showListTable')
    Route.get('show-request-list-common', 'RequestController.showListCommon')
    Route.get('show-request-create-common', 'RequestController.showCreateCommon')
    Route.get('show-request-edit-common', 'RequestController.showEditCommon')
    //Route.post('delete-request', 'RequestController.delete')
    Route.post('create-request', 'RequestController.create')
    Route.post('update-request', 'RequestController.update')
    Route.post('upload-request', 'RequestController.upload')
    Route.post('upload-request-describe', 'RequestController.updateDescribe')

    //任务
    Route.get('show-task-list-table', 'TaskController.showListTable')
    Route.get('show-task-list-common', 'TaskController.showListCommon')
    Route.get('show-task-create-common', 'TaskController.showCreateCommon')
    Route.get('show-task-edit-common', 'TaskController.showEditCommon')
    //Route.post('delete-task', 'TaskController.delete')
    Route.post('create-task', 'TaskController.create')
    Route.post('update-task', 'TaskController.update')
    Route.post('upload-task', 'TaskController.upload')
    Route.post('update-task-timer', 'TaskController.updateTaskTimer')
    Route.post('upload-task-describe', 'TaskController.updateDescribe')

    //用户
    Route.get('show-member-list-table', 'MemberController.showListTable')
    Route.get('show-member-list-common', 'MemberController.showListCommon')
    Route.get('show-member-create-common', 'MemberController.showCreateCommon')
    Route.get('show-member-edit-common', 'MemberController.showEditCommon')
    Route.post('delete-member', 'MemberController.delete')
    Route.post('update-member', 'MemberController.update')

    //下载
    Route.get('download/:type/:file', 'DownloadController.download')

    //查看图片缩略图
    Route.get('show-images/:type/:file', 'DownloadController.showImages')
  } catch (err) {
    Logger.err(err)
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
    Logger.err(err)
    return {
      code: 9999,
      msg: '服务端无此路由',
      data: null,
    }
  }
}).prefix('api/v1')

//以下为测试路由，可删除===================
Route.get('/test1', 'PC/TestController.test1')

Route.get('/test2/:type/:file', 'TestController.test2')

//如果匹配不到路由，则转到404页面
//Route.any('*', ({ view }) => view.render('404'))
Route.any('*', () => {
  return {
    code: 9999,
    msg: '服务端无此路由',
    data: null,
  }
})
