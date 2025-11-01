'use strict'
const Redis = use('Redis')
const Util = require('@Lib/Util')
const Cache = require('@Lib/Cache')

class NoAuth {
  async handle(ctx, next) {
    try {
      //get func info
      let url = ctx.request.url()
      if (!(await Redis.get(url))) {
        await Redis.set(url, 0, 'EX', 3600 * 24)
      }
      await Redis.incr(url)

      // 检查翻译缓存，如果为空则异步触发重新加载
      let transObj = Cache.get('translation')
      if (!transObj) {
        // 异步重新加载翻译（不阻塞请求）
        const CommonService = require('@Services/CommonService')
        const commonService = new CommonService()
        commonService.refreshCurrentLanguage().catch((err) => {
          console.error('中间件触发翻译重新加载失败:', err.message)
        })
      }

      //view注入公共函数
      ctx.view.share({
        trans: (source) => {
          return Util.trans(source)
        },
      })

      await next()
    } catch (err) {
      console.log(err)
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
          code: 401,
          track: 'handle_' + url,
        })
      )
    }
  }
}

module.exports = NoAuth
