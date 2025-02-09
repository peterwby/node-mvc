'use strict'

const { test, trait } = use('Test/Suite')('Example')
const assert = require('assert')
trait('Test/ApiClient')

test('path alias should work correctly', async () => {
  // 测试 @Lib 别名
  const Util = use('@Lib/Util')
  assert.ok(Util !== null && Util !== undefined, '@Lib alias should work')

  // 测试 @Services 别名
  const CommonService = use('@Services/CommonService')
  assert.ok(CommonService !== null && CommonService !== undefined, '@Services alias should work')

  // 测试 @Table 别名
  const RolesModel = use('@Table/roles')
  assert.ok(RolesModel !== null && RolesModel !== undefined, '@Table alias should work')

  // 测试 @Middleware 别名
  const CheckViewAuth = use('@Middleware/CheckViewAuth')
  assert.ok(CheckViewAuth !== null && CheckViewAuth !== undefined, '@Middleware alias should work')
})
