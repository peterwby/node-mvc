'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('moment') //日期格式化插件
moment.locale('zh-cn') //设为北京时区
const Env = use('Env')

class TestController {
  constructor() {}

  async getData(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await getDataValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      const Request = require('@Lib/Request')
      result = await Request.post(Env.get('API_URL') + 'member/get-table-common', {}, { token: ctx.session.get('token') })
      const { data } = result.data
      //console.log(data.status_list)
      //组装从Service返回的数据，返回给前端
      return ctx.view.render('html.test-get-data', { status_list: data.status_list })
    } catch (err) {
      return ctx.view.render('html.test-get-data', {})
    }
  }
}

async function getDataValid(ctx) {
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
          case 'member_status_id':
            body.member_status_id = requestAll[k]
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {}

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_getDataValid_1593917444',
    })
  }
}

module.exports = TestController
