'use strict'
const Env = use('Env')
const Redis = use('Redis')
const Util = require('@Lib/Util')
const MenuService = require('@Services/MenuService')
const menuService = new MenuService()
const Cache = require('@Lib/Cache')
const SystemConfigService = require('@Services/SystemConfigService')

class CheckViewAuth {
  // 视图白名单，这些页面不需要权限检查
  static whiteList = ['/admin/member/edit-password']

  async handle(ctx, next) {
    try {
      // 初始化系统配置服务（复用同一个实例）
      const systemConfigService = new SystemConfigService()

      // 检查维护模式（在认证之前检查）
      const configResult = await systemConfigService.getConfig('maintenance_mode')

      if (configResult.status > 0 && configResult.data && configResult.data.config_value === '1') {
        // 系统处于维护模式
        const session = ctx.session
        const roleIds = session.get('role_ids') || []

        // 超级管理员（role_id=1）可以跳过维护模式
        if (!roleIds || !roleIds.includes(1)) {
          // 获取维护提示信息
          const messageResult = await systemConfigService.getConfig('maintenance_message')
          const message = messageResult.status > 0 && messageResult.data ? messageResult.data.config_value : '系统维护中，请稍后再试'

          // 返回维护页面
          return ctx.view.render('error.maintenance', {
            message: message,
          })
        }
      }

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
      const roleIds = session.get('role_ids') || []
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

      // 检查是否为超级管理员（role_id=1）
      const isSuperAdmin = roleIds && roleIds.includes(1)

      // 菜单权限检查（超级管理员跳过）
      if (!isSuperAdmin && !Util.checkPermission(viewPath, permissions)) {
        console.log('已有权限：', permissions)
        console.log('没有该权限：', viewPath)
        return ctx.response.redirect('/admin/auth/sign-in')
      }

      // 检查翻译缓存，如果为空则异步触发重新加载
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

      //view注入公共函数和全局变量
      const menuResult = await menuService.getMenuTree(permissions, roleIds)
      const member_info = session.get('member')

      // 加载系统配置（复用已创建的systemConfigService实例）
      const allConfigsResult = await systemConfigService.getAllConfigs()
      const systemConfig = allConfigsResult.status > 0 ? allConfigsResult.data : {}

      ctx.view.share({
        trans: (source) => {
          return Util.trans(source)
        },
        hasPermission: (key) => {
          return !!permissions[key]
        },
        menus: menuResult.data,
        member_info: member_info,
        systemConfig: systemConfig,
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
