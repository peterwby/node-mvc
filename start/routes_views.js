'use strict'

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')
const Util = require('../app/Lib/Util')

module.exports = () => {
  // View层 - 需要验证身份的路由
  Route.group(() => {
    try {
      Route.get('/', 'HomeController.home')
      // permissions
      Route.get('permissions/list', 'PermissionsController.list')
      Route.get('permissions/create', 'PermissionsController.create')
      Route.get('permissions/edit/:id', 'PermissionsController.edit')
      Route.get('permissions/view/:id', 'PermissionsController.view')

      // roles
      Route.get('roles/list', 'RolesController.list')
      Route.get('roles/create', 'RolesController.create')
      Route.get('roles/edit/:id', 'RolesController.edit')
      Route.get('roles/view/:id', 'RolesController.view')
      Route.get('roles/permissions/:id', 'RolesController.permissions')

      Route.get('member/list', 'MemberController.list')
      Route.get('member/view/:member_id', 'MemberController.view')
      Route.get('member/edit/:member_id', 'MemberController.edit')
      Route.post('member/edit-info', 'MemberController.editInfo')
      Route.get('member/create', 'MemberController.create')
      Route.get('member/roles/:id', 'MemberController.roles')
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
}
