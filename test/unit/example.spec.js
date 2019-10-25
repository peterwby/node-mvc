'use strict'

const { test, trait } = use('Test/Suite')('Example')
trait('Test/ApiClient')

//功能测试，通过访问url来判断执行结果是否正确
test('update user name by id', async ({ client }) => {
  const response = await client
    .get('/test')
    .query({ username: 'eee', id: 3 })
    .end()

  response.assertStatus(200)
  response.assertJSONSubset({
    msg: '更新成功',
    code: 0,
  })
})
//单元测试，测试某个函数的结果是否正确
test('findDb', async ({ assert }) => {
  const TestService = require('../../app/Services/TestService')
  const testService = new TestService()

  assert.deepInclude(await testService.findDb({ body: { id: 3 } }), {
    data: [
      {
        userName: 'eee',
        status: 0,
      },
    ],
  })
})
