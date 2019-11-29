'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const moment = require('moment') //日期格式化插件
moment.locale('zh-cn') //设为北京时区
const Util = require('../../../Lib/Util')

class EmptyController {
  constructor() {}

  async test(ctx) {
    try {
      //检查参数合法性

      //调用业务逻辑Service

      //组装从Service返回的数据，返回给前端
      return Util.end2front()
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: '304jrlkdg3jgrdl',
      })
    }
  }
}

/**
 * 校验权限和参数
 * @example
 * testValid(ctx)
 * @returns object
 */
async function testValid(ctx) {
  try {
    //校验身份权限
    await authValid()
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()

    return Util.end({})

    async function authValid() {}

    async function paramsHandle() {}

    async function paramsValid() {}
  } catch (err) {
    return Util.error({
      msg: err.message,
      track: 'sdg34etrfsdgs',
    })
  }
}

module.exports = EmptyController
