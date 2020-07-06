'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('moment') //日期格式化插件
moment.locale('zh-cn') //设为北京时区
const MemberService = require(`@Services/MemberService`)
const memberService = new MemberService()

class MemberController {
  constructor() {}

  async saveToken(ctx) {
    try {
      //检查参数合法性
      const resultValid = await saveTokenValid(ctx)
      if (resultValid) return resultValid
      let { token } = ctx.body
      ctx.session.put('token', token)
      //组装从Service返回的数据，返回给前端
      return Util.end2front({})
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_saveToken_159378345',
      })
    }
  }

  async removeToken(ctx) {
    try {
      ctx.session.clear()
      //组装从Service返回的数据，返回给前端
      return Util.end2front({})
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_logout_158609798u',
      })
    }
  }
}

async function saveTokenValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'token':
            body.token = requestAll[k]
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        token: 'required',
      }
      const messages = {
        'token.required': 'token为必填项',
      }
      const validation = await validate(ctx.body, rules, messages)
      if (validation.fails()) {
        throw new Error(validation.messages()[0].message)
      }
    }

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_saveTokenValid_158609709jk',
    })
  }
}

module.exports = MemberController
