'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('dayjs') //日期格式化插件

class IndexController {
  constructor() {}

  async home(ctx) {
    try {
      let result = {}

      let member_info = ctx.session.get('member') || {}
      
      // 加载系统配置
      const SystemConfigService = require('@Services/SystemConfigService')
      const systemConfigService = new SystemConfigService()
      const configResult = await systemConfigService.getAllConfigs()
      const systemConfig = configResult.status > 0 ? configResult.data : {}
      
      return ctx.view.render('admin.index', { 
        username: member_info.nickname,
        systemConfig: systemConfig
      })
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }

  /**
   * 获取统计数据API
   */
  async getStatistics(ctx) {
    try {
      const DashboardService = require('@Services/DashboardService')
      const dashboardService = new DashboardService()
      const result = await dashboardService.getStatistics()
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_getStatistics_1739012356882',
      })
    }
  }
}

module.exports = IndexController
