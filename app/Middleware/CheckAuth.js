'use strict'
const Env = use('Env')
const Redis = use('Redis')
const Util = require('@Lib/Util')
const MenuService = require('@Services/MenuService')
const menuService = new MenuService()

class CheckAuth {
  async handle(ctx, next) {
    try {
      const session = ctx.session
      if (!session.get('member')) {
        //session无效
        ctx.session.clear()
        // 显式清除 session cookie
        ctx.response.clearCookie('token', {
          path: '/',
          domain: ctx.request.hostname(),
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
        })
        return ctx.response.redirect('/admin/auth/sign-in')
        // return ctx.response.send(
        //   Util.end2front({
        //     msg: '身份已过期，请重新登录',
        //     code: 401,
        //   })
        // )
      }

      //get func info
      if (Env.get('LOG_API_CALL_COUNT') === '1') {
        let url = ctx.request.url()
        if (!(await Redis.get(`count_${url}`))) {
          await Redis.set(`count_${url}`, 0, 'EX', 3600 * 24)
        }
        await Redis.incr(`count_${url}`)
      }

      //get func time
      let from_time = new Date().getTime()

      //view注入公共函数
      const menuResult = await menuService.getMenuTree()
      ctx.view.share({
        trans: (source) => {
          return Util.trans(source)
        },
        menus: menuResult.data,
      })

      await next()

      //get func time
      if (Env.get('LOG_API_RES_TIME') === '1') {
        let to_time = new Date().getTime()
        let used_time = parseInt((to_time - from_time) / 1000)

        if (used_time >= 5) {
          let api_url = ctx.request.url()
          let timeObj = {}
          let cacheContent = await Redis.get(`time_${api_url}`)
          if (!cacheContent) {
            timeObj = {
              sec_5: 0,
              sec_10: 0,
              sec_15: 0,
              more_20: 0,
              other: 0,
            }
          } else {
            timeObj = JSON.parse(cacheContent)
          }

          if (used_time >= 5 && used_time < 10) {
            timeObj.sec_5 = parseInt(timeObj.sec_5) + 1
          } else if (used_time >= 10 && used_time < 15) {
            timeObj.sec_10 = parseInt(timeObj.sec_10) + 1
          } else if (used_time >= 15 && used_time < 20) {
            timeObj.sec_15 = parseInt(timeObj.sec_15) + 1
          } else if (used_time >= 20) {
            timeObj.more_20 = parseInt(timeObj.more_20) + 1
          }
          if (!cacheContent) {
            await Redis.set(`time_${api_url}`, JSON.stringify(timeObj), 'EX', 3600 * 24)
          } else {
            await Redis.set(`time_${api_url}`, JSON.stringify(timeObj))
          }
        }
      }
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
          code: 401,
          track: 'handle_' + url,
        })
      )
    }
  }

  async wsHandle(ctx, next) {
    await next()
  }
}

module.exports = CheckAuth
