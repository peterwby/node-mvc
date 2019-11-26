'use strict'

const log = use('Logger')
const Env = use('Env')
/**
 * 检查客户端传递过来的参数是否合法
 */
class CheckAuthByString {
  async handle(ctx, next) {
    try {
      const body = ctx.request.all()
      let access_token = ctx.request.header('access_token')
      access_token = access_token || (body && body.access_token ? body.access_token : '')
      if (access_token !== Env.get('AUTH_KEY')) {
        return ctx.response.send({
          code: 9999,
          msg: '没有权限',
          data: null,
        })
      }
      await next()
    } catch (err) {
      log.notice('89y89y8')
      return ctx.response.send({
        code: 9999,
        msg: '验证权限时出错',
        data: null,
      })
    }
  }
}

module.exports = CheckAuthByString
