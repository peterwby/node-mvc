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

      // 检查翻译缓存，如果为空则触发重新加载（带锁机制防止并发）
      let transObj = Cache.get('translation')
      if (!transObj) {
        // 使用锁机制防止并发时多次触发刷新
        const refreshLock = Cache.get('translation_refreshing')
        if (!refreshLock) {
          Cache.set('translation_refreshing', true, 'EX', 60) // 锁60秒
          try {
            // 等待翻译加载完成（主要等待本地文件加载，很快）
            const CommonService = require('@Services/CommonService')
            const commonService = new CommonService()
            await commonService.refreshCurrentLanguage()
            // 刷新完成后移除锁
            Cache.del('translation_refreshing')
          } catch (err) {
            console.error('中间件触发翻译重新加载失败:', err.message)
            // 即使失败也要移除锁，允许下次重试
            Cache.del('translation_refreshing')
          }
        }
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
