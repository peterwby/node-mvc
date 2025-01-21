'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')

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
