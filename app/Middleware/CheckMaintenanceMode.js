'use strict'

const Redis = use('Redis')
const SystemConfigService = require('@Services/SystemConfigService')
const systemConfigService = new SystemConfigService()
const Util = require('@Lib/Util')

class CheckMaintenanceMode {
  /**
   * 检查系统是否处于维护模式
   * 如果是维护模式，且用户不是超级管理员，则返回维护页面
   */
  async handle(ctx, next) {
    try {
      // 获取维护模式配置（带缓存）
      const configResult = await systemConfigService.getConfig('maintenance_mode')
      
      if (configResult.status > 0 && configResult.data && configResult.data.config_value === '1') {
        // 系统处于维护模式，检查用户权限
        const session = ctx.session
        const roleIds = session.get('role_ids') || []
        
        // 超级管理员（role_id=1）可以跳过维护模式
        if (!roleIds || !roleIds.includes(1)) {
          // 获取维护提示信息
          const messageResult = await systemConfigService.getConfig('maintenance_message')
          const message = messageResult.status > 0 && messageResult.data 
            ? messageResult.data.config_value 
            : '系统维护中，请稍后再试'
          
          // 返回维护页面
          return ctx.view.render('error.maintenance', {
            message: message,
          })
        }
      }

      // 继续执行下一个中间件
      await next()
    } catch (err) {
      // 维护模式检查失败不影响正常流程
      console.log('维护模式检查失败:', err.message)
      await next()
    }
  }
}

module.exports = CheckMaintenanceMode

