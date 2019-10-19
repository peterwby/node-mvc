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
      const rules = {
        email: 'required|email|unique:users,email',
        password: 'required',
      }
      const validation = await validate(ctx.request.all(), rules)
      if (validation.fails()) {
        throw new Error('请求的参数不符合规范')
      }
      //调用业务逻辑
      const result = await testSrv.httpGet()
      //组装数据

      return result
    } catch (err) {
      log.err(err.message)
      //对前台屏蔽真实错误，返回错误码
      return {
        fail: true,
        msg: '出现错误',
        errCode: '934792389',
      }
    }
  }
}

module.exports = TestController
