// API路由组 - 需要验证身份的路由
Route.group(() => {
  try {
    Route.post('{{ module_name }}/get-list', '{{ module_name | pascal }}Controller.getList')
    Route.post('{{ module_name }}/create', '{{ module_name | pascal }}Controller.create')
    Route.post('{{ module_name }}/update', '{{ module_name | pascal }}Controller.update')
    Route.post('{{ module_name }}/remove', '{{ module_name | pascal }}Controller.remove')
    Route.post('{{ module_name }}/batch-remove', '{{ module_name | pascal }}Controller.batchRemove')
    Route.get('{{ module_name }}/detail/:{{ module_name }}_id', '{{ module_name | pascal }}Controller.detail')
  } catch (err) {
    return Util.end2front({
      msg: 'Not found the API',
      code: 9991,
    })
  }
})
  .prefix('api')
  .middleware(['checkApiAuth'])

// View层 - 需要验证身份的路由
Route.group(() => {
  try {
    Route.get('{{ module_name }}/list', '{{ module_name | pascal }}Controller.list')
    Route.get('{{ module_name }}/create', '{{ module_name | pascal }}Controller.create')
    Route.get('{{ module_name }}/edit/:{{ module_name }}_id', '{{ module_name | pascal }}Controller.edit')
    Route.get('{{ module_name }}/view/:{{ module_name }}_id', '{{ module_name | pascal }}Controller.view')
  } catch (err) {
    return Util.end2front({
      msg: 'Not found the API',
      code: 9992,
    })
  }
})
  .prefix('admin')
  .middleware(['checkViewAuth'])
