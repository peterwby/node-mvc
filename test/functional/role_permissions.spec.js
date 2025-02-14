'use strict'

const { test, trait } = use('Test/Suite')('Role Permissions')
const RolesService = use('App/Services/RolesService')
const Database = use('Database')

trait('Test/ApiClient')
trait('Auth/Client')

test('获取角色权限列表', async ({ client }) => {
  const role_id = 1 // 假设存在ID为1的角色
  const response = await client.get(`/api/roles/permissions/${role_id}`).end()

  response.assertStatus(200)
  response.assertJSONSubset({
    status: 1,
    data: {
      permissions: Array,
    },
  })
})

test('保存角色权限', async ({ client }) => {
  const role_id = 1 // 假设存在ID为1的角色
  const permission_ids = [1, 2, 3] // 假设存在这些权限ID

  const response = await client.post(`/api/roles/permissions/${role_id}`).send({ permission_ids }).end()

  response.assertStatus(200)
  response.assertJSONSubset({
    status: 1,
    msg: '保存成功',
  })

  // 验证数据库中的权限是否正确保存
  const savedPermissions = await Database.table('role_permissions').where('role_id', role_id).pluck('permission_id')

  // 验证保存的权限ID是否与请求的一致
  assert.deepEqual(savedPermissions.sort(), permission_ids.sort())
})

test('保存角色权限 - 角色不存在', async ({ client }) => {
  const role_id = 999999 // 不存在的角色ID
  const permission_ids = [1, 2, 3]

  const response = await client.post(`/api/roles/permissions/${role_id}`).send({ permission_ids }).end()

  response.assertStatus(200)
  response.assertJSONSubset({
    status: 0,
    msg: '角色不存在',
  })
})

test('保存角色权限 - 权限ID不合法', async ({ client }) => {
  const role_id = 1
  const permission_ids = [999999] // 不存在的权限ID

  const response = await client.post(`/api/roles/permissions/${role_id}`).send({ permission_ids }).end()

  response.assertStatus(200)
  response.assertJSONSubset({
    status: 0,
    msg: '存在无效的权限ID',
  })
})
