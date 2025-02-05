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
