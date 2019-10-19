'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const TestSrv = require(`../../../Services/TestService`)
const testSrv = new TestSrv()

class TestController {
  //测试
  async test1(ctx) {
    try {
      //校验输入的参数
      const resultValid = await validTest(ctx)
      if (resultValid.fail) {
        throw new Error(resultValid.msg)
      }
      //调用业务逻辑
      const result = await testSrv.httpGet()
      //组装数据
      return {
        fail: false,
        msg: '成功',
        data: result.data.data.t,
      }
    } catch (err) {
      log.error(err.message)
      //对前端屏蔽真实错误，返回错误码
      return {
        fail: true,
        msg: '出现错误',
        code: '934792389',
      }
    }
  }
}
//校验规则
const validTest = async ctx => {
  try {
    const rules = {
      uname: 'required|alpha_numeric',
      beginDate: 'date|after:2019-10-01',
      age: 'number|above:10',
      data: 'json', //data={"a":"1"},data的值能被JSON.parse(data)
      sex: 'in:1,2',
      level: 'equals:2',
      password: 'min:6|max:10',
      repassword: 'same:password',
    }
    const messages = {
      'uname.required': '用户名为必填项',
      'uname.alpha_numeric': '用户名应为字母和数字',
      'age.above': '年龄应为大于等于20的数字',
      'sex.in': '性别只能是1或2',
      'password.min': '密码最小6位数',
      'password.max': '密码最大10位数',
      'repassword.same': '两次密码不一致',
    }
    const validation = await validate(ctx.request.all(), rules, messages)
    if (validation.fails()) {
      throw new Error(validation.messages()[0].message)
    }
    return {
      fail: false,
    }
  } catch (err) {
    return {
      fail: true,
      msg: err.message,
    }
  }
}

module.exports = TestController
