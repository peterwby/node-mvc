'use strict'

const log = use('Logger')
const Env = use('Env')
/**
 * 检查业务逻辑端server-biz传递过来的参数是否合法
 */
class CheckAuthByRedis {
  async handle(ctx, next) {
    try {
      const body = ctx.request.all()
      const params = body && body.sk ? body.sk : ''
      if (params !== Env.get('STRING_KEY')) {
        return ctx.response.send({
          code: 9999,
          msg: '请求参数权限验证失败',
          data: null,
        })
      }
      await next()
    } catch (err) {
      log.notice('89y89y8')
      return ctx.response.send({
        code: 9999,
        msg: '请求参数权限验证出错',
        data: null,
      })
    }
  }
}

module.exports = CheckAuthByRedis
