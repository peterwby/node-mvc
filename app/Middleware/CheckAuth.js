'use strict'

const Util = require('@Lib/Util')

class CheckAuth {
  async handle(ctx, next) {
    try {
      const session = ctx.session
      if (!session.get('member')) {
        //session无效
        ctx.session.clear()
        return ctx.response.send(
          Util.end2front({
            msg: '身份已过期，请重新登录',
            code: 1001,
          })
        )
      }
      await next()
    } catch (err) {
      if (err.message && err.message.indexOf('E_UNDEFINED_METHOD') != -1) {
        return ctx.response.send(
          Util.end2front({
            msg: '服务端未定义此方法',
            code: 9999,
          })
        )
      }
      return ctx.response.send(
        Util.error2front({
          msg: err.message,
          code: 1001,
          track: '902gejfndk8',
        })
      )
    }
  }
}

module.exports = CheckAuth
