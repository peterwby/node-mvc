'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('moment') //日期格式化插件
moment.locale('zh-cn') //设为北京时区

class IndexController {
  constructor() {}
  async init(ctx) {
    try {
      let result = {}

      //调用业务逻辑Service
      //result = await .init(ctx)
      //组装从Service返回的数据，返回给前端
      return ctx.view.render('html.index', {})
    } catch (err) {
      return ctx.view.render('html.index')
    }
  }
}

module.exports = IndexController
