'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('../../../Lib/Util')
const TestService = require(`../../../Services/TestService`)
const testService = new TestService()
const TestRemoteService = require(`../../../Services/TestRemoteService`)
const testRemoteService = new TestRemoteService()

class TestController {
  async test2(ctx) {
    try {
      //调用业务逻辑
      const result = await testRemoteService.createDb(ctx)
      if (result.error) {
        throw new Error(result.msg)
      }
      //组装数据，返回json给前端
      return Util.end2front({
        msg: result.msg,
        data: result.data,
        code: result.status > 0 ? 0 : 1000,
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        code: 9000,
        track: '23r234234',
      })
    }
  }
  /**
   * 测试
   * @example
   * test(ctx)
   * @returns object
   */
  async test(ctx) {
    try {
      //校验权限和参数
      const resultValid = await testValid(ctx)
      if (resultValid.error) {
        return Util.error2front({
          isShowMsg: true,
          msg: resultValid.msg,
          code: 9000,
          track: '9834jld6',
        })
      }
      //调用业务逻辑
      const result = await testService.updateDb(ctx)
      if (result.error) {
        throw new Error(result.msg)
      }
      //组装数据，返回json给前端
      return Util.end2front({
        msg: result.msg,
        data: result.data,
        code: result.status > 0 ? 0 : 1000,
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        code: 9000,
        track: '023j0f93j89',
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

    async function paramsHandle() {
      let bodyRaw = ctx.request.all()
      let body = {
        id: 0,
        set: {},
      }
      for (let k in bodyRaw) {
        switch (k.toLowerCase()) {
          case 'username':
            body.set.userName = bodyRaw[k]
            break
          case 'id':
            body.id = bodyRaw[k]
            break
          default:
            break
        }
      }
      ctx.body = body
    }

    /*async function paramsHandle() {
      let bodyRaw = ctx.request.all()
      let body = {
        id: 0,
      }
      for (let k in bodyRaw) {
        switch (k.toLowerCase()) {
          case 'id':
            body.id = bodyRaw[k]
            break
          default:
            break
        }
      }
      ctx.body = body
    }*/

    async function paramsValid() {
      const rules = {
        userName: 'required|alpha_numeric',
        beginDate: 'date|after:2019-10-01',
        age: 'number|above:10',
        data: 'json', //data={"a":"1"},data的值能被JSON.parse(data)
        sex: 'in:1,2',
        status: 'equals:1',
        password: 'min:6|max:10',
        rePassword: 'same:password',
      }
      const messages = {
        'userName.required': '用户名为必填项',
        'userName.alpha_numeric': '用户名应为字母和数字',
        'age.above': '年龄应为大于等于20的数字',
        'sex.in': '性别只能是1或2',
        'password.min': '密码最小6位数',
        'password.max': '密码最大10位数',
        'rePassword.same': '两次密码不一致',
      }
      const validation = await validate(ctx.body.set, rules, messages)
      if (validation.fails()) {
        throw new Error(validation.messages()[0].message)
      }
      if (Number(ctx.body.id) <= 0) {
        throw new Error('id应为数字')
      }
    }
  } catch (err) {
    return Util.error({
      msg: err.message,
      track: 'jkl230034',
    })
  }
}

module.exports = TestController
