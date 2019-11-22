'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const moment = require('moment') //日期格式化插件
moment.locale('zh-cn') //设为北京时区
const Util = require('../../../Lib/Util')
//引用Service里的类并初始化
const testService = new (require(`../../../Services/TestService`))()

class TestController {
  //---------------------------------------------
  //async 方法名(ctx)，固定格式，其中ctx是一个对象，表示请求的上下文，ctx = { request, response, session }
  //每个Controller的方法return时，都需通过return Util.end2front()，使得返回的对象的格式具有一致性
  //---------------------------------------------

  /**
   * 返回一个包含hello world文本的对象
   * @returns object
   */
  async test1(ctx) {
    //调用service层来处理业务逻辑
    const result = await testService.test1(ctx)
    //返回结果给前端
    return Util.end2front({
      msg: result.msg,
    })
  }

  /**
   * 在数据库中插入一条记录
   * @returns object
   */
  async test2(ctx) {
    try {
      //获取前端get和post方式传递过来的所有参数
      let requestAll = ctx.request.all()

      //这里对参数进行组装。比如，前端传递的参数是uname，但数据库表的字段是user_name，就需要进行转换组装
      //注：js默认格式是驼峰式，mysql默认是下划线，将在model层进行转换。这里只需写成userName，而不是user_name
      let body = {
        userName: requestAll.uname,
        status: requestAll.status,
      }
      //约定：把组装后的对象传给ctx.body，供service层调用
      ctx.body = body

      //调用service层来处理业务逻辑
      const result = await testService.test2(ctx)
      if (result.error) {
        throw new Error(result.msg)
      }
      //返回结果给前端
      return Util.end2front({
        msg: result.msg,
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

  /**
   * 从数据库中获取数据
   * @returns object
   */
  async test3(ctx) {
    try {
      //获取前端get和post方式传递过来的所有参数
      let requestAll = ctx.request.all()

      //对前端请求参数进行组装
      let body = {
        filter: {
          //要过滤的条件
          fromDate: moment(requestAll.fromDate).format('YYYY-MM-DD'),
          toDate: moment(requestAll.toDate).format('YYYY-MM-DD'),
          status: requestAll.status,
          keyword: requestAll.keyword,
          page: requestAll.page,
          limit: requestAll.limit,
        },
      }
      //约定：把组装后的请求参数赋值给ctx.body，供service层调用
      ctx.body = body
      //调用service层来处理业务逻辑
      const result = await testService.test3(ctx)
      if (result.error) {
        throw new Error(result.msg)
      }
      //组装获取到的数据。比如service获取到了10个字段，但前端只需用到4个，就在这里进行组装
      let data = []
      for (let item of result.data) {
        data.push({ userName: item.userName, ctime: moment(item.ctime).format('YYYY-MM-DD'), authName: item.authName })
      }
      //返回结果给前端
      return Util.end2front({
        msg: '查询完成',
        data: data,
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        code: 9000,
        track: 'kljsdf09j2903j',
      })
    }
  }
  // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  // XXXX       以下还在修改中                    XXXX
  // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
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
      ctx.body = Util.deepClone(body)
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
      ctx.body = Util.deepClone(body)
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
