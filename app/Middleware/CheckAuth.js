'use strict'

const log = use('log')

class CheckAuth {
  async handle(ctx, next) {
    try {
      const session = ctx.session
      if (!session.get('userid')) {
        //session无效
        log.error('身份已过期，请重新登录')
        ctx.session.clear()
        return ctx.response.send({
          code: 1001,
          msg: '身份已过期，请重新登录',
          data: null,
        })
      }
      await next()
    } catch (err) {
      log.notice('j3o4jg09')
      if (err.message && err.message.indexOf('E_UNDEFINED_METHOD') != -1) {
        log.error(err.message)
        return ctx.response.send({
          code: 9999,
          msg: '服务端未定义此方法',
          data: null,
        })
      }
      log.error(err.message)
      log.error('身份验证异常，请重新登录')
      return ctx.response.send({
        code: 1001,
        msg: '身份验证异常，请重新登录',
        data: null,
      })
    }
  }
}

module.exports = CheckAuth
