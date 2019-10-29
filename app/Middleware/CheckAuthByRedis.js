'use strict'

const log = use('Logger')
const Redis = use('Redis')

/**
 * 检查业务逻辑端server-biz传递过来的参数是否合法
 */
class CheckAuthByRedis {
  async handle(ctx, next) {
    try {
      const body = ctx.request.all()
      let params = await Redis.get(body.rk)
      await Redis.del(body.rk) //阅后即焚
      if (!params) {
        return ctx.response.send({
          code: 9999,
          msg: '请求参数权限验证失败',
          data: null,
        })
      }
      await next()
    } catch (err) {
      log.notice('klj6fg94')
      return ctx.response.send({
        code: 9999,
        msg: '请求参数权限验证出错',
        data: null,
      })
    }
  }
}

module.exports = CheckAuthByRedis
