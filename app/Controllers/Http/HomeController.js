'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('moment') //日期格式化插件

class IndexController {
  constructor() {}

  async home(ctx) {
    try {
      let result = {}

      let member_info = ctx.session.get('member') || {}
      return ctx.view.render('admin.index', { username: member_info.nickname })
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }
}

module.exports = IndexController
