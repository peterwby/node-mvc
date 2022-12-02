'use strict'
const Redis = use('Redis')

class NoAuth {
  async handle(ctx, next) {
    try {
      //get func info
      let url = ctx.request.url()
      if (!(await Redis.get(url))) {
        await Redis.set(url, 0, 'EX', 3600 * 24)
      }
      await Redis.incr(url)

      await next()
    } catch (err) {
      let url = ctx.request.url()
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
          track: 'handle_' + url,
        })
      )
    }
  }
}

module.exports = NoAuth
