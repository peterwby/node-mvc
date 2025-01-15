'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('moment') //日期格式化插件
moment.locale('zh-cn') //设为北京时区

class AuthController {
  constructor() {}

  async signIn(ctx) {
    return ctx.view.render('admin.auth.sign-in', {})
  }

  async signUp(ctx) {
    return ctx.view.render('admin.auth.sign-up', {})
  }
}

module.exports = AuthController
