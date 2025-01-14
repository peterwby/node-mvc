'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('moment') //日期格式化插件
moment.locale('zh-cn') //设为北京时区

class IndexController {
  constructor() {}

  async home(ctx) {
    try {
      let result = {}
      //检查参数合法性
      // const resultValid = await homeValid(ctx)
      // if (resultValid) return resultValid
      //调用业务逻辑Service
      //result = await .home(ctx)
      //组装从Service返回的数据，返回给前端
      let member_info = ctx.session.get('member') || {}
      return ctx.view.render('admin.index', { username: member_info.nickname })
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }
}

module.exports = IndexController
