'use strict'
const Env = use('Env')
const Redis = use('Redis')
const Util = require('@Lib/Util')
const MenuService = require('@Services/MenuService')
const menuService = new MenuService()

class CheckViewAuth {
  // 视图白名单，这些页面不需要权限检查
  static whiteList = ['/admin/member/edit-password']

  async handle(ctx, next) {
    try {
      const session = ctx.session
      if (!session.get('member')) {
        console.log('member session invalid')
        ctx.session.clear()
        // 显式清除 session cookie
        ctx.response.clearCookie('token', {
          path: '/',
          domain: ctx.request.hostname(),
          //secure: true,
          httpOnly: true,
          //sameSite: 'lax',
        })
        return ctx.response.redirect('/admin/auth/sign-in')
      }

      // 权限检查
      const permissions = session.get('permissions') || {}
      const url = ctx.request.url()
      // 去掉 query 参数
      let viewPath = url.split('?')[0]
      if (viewPath === '/admin') {
        viewPath = '/admin/'
      }
      // 检查是否在白名单中
      if (CheckViewAuth.whiteList.includes(viewPath)) {
        await next()
        return
      }

      // 菜单权限检查
      if (!Util.checkPermission(viewPath, permissions)) {
        console.log('已有权限：', permissions)
        console.log('没有该权限：', viewPath)
        return ctx.response.redirect('/admin/auth/sign-in')
      }

      //view注入公共函数和全局变量
      const menuResult = await menuService.getMenuTree(permissions)
      ctx.view.share({
        trans: (source) => {
          return Util.trans(source)
        },
        hasPermission: (key) => {
          return !!permissions[key]
        },
        menus: menuResult.data,
        globalData: {
          permissions,
        },
      })

      await next()
    } catch (err) {
      let url = ctx.request.url()
      if (err.message && err.message.indexOf('E_UNDEFINED_METHOD') != -1) {
        return ctx.response.send(
          Util.end2front({
            msg: '服务端未定义此方法',
            code: 401,
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

module.exports = CheckViewAuth
