// @position: after Route.get('/', 'HomeController.home')
// ${module_name}
Route.get('${module_name}/list', '${module_name | pascal}Controller.list')
Route.get('${module_name}/create', '${module_name | pascal}Controller.create')
Route.get('${module_name}/edit/:id', '${module_name | pascal}Controller.edit')
Route.get('${module_name}/view/:id', '${module_name | pascal}Controller.view')

// @position: after Route.post('upload/image', 'CommonController.uploadImage')
// ${module_name}
Route.post('${module_name}/get-list', '${module_name | pascal}Controller.getList')
Route.post('${module_name}/create-info', '${module_name | pascal}Controller.createInfo')
Route.post('${module_name}/update-info', '${module_name | pascal}Controller.updateInfo')
Route.post('${module_name}/remove', '${module_name | pascal}Controller.remove')
