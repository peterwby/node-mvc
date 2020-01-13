'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const moment = require('moment') //日期格式化插件
moment.locale('zh-cn') //设为北京时区
const Util = require('@Lib/Util')
//引用Service里的类并初始化
const TestService = require(`@Services/TestService`)
const testService = new TestService()

class TestController {
  constructor() {
    this.str1 = '<h3>======数组===================</h3>'
    this.str2 = '<h3>======字符串===================</h3>'
    this.str3 = '<h3>======日期===================</h3>'
    this.str4 = '<h3>======对象===================</h3>'
    this.str5 = '<h3>======类型检测===================</h3>'
  }
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
      let body = {
        user_name: requestAll.uname,
        status: requestAll.status,
      }
      //约定：把组装后的对象传给ctx.body，供service层调用
      ctx.body = body

      //调用service层来处理业务逻辑
      const result = await testService.test2(ctx)

      //返回结果给前端
      return Util.end2front({
        msg: result.msg,
        data: result.data,
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
          fromdate: moment(requestAll.fromdate).format('YYYY-MM-DD'),
          todate: moment(requestAll.todate).format('YYYY-MM-DD'),
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

      //组装获取到的数据。比如service获取到了10个字段，但前端只需用到4个，就在这里进行组装
      let data = []
      for (let item of result.data) {
        data.push({ user_name: item.user_name, ctime: moment(item.ctime).format('YYYY-MM-DD'), auth_name: item.auth_name })
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

  async test4(ctx) {
    try {
      //获取前端get和post方式传递过来的所有参数
      let requestAll = ctx.request.all()

      //对前端请求参数进行组装
      let body = {
        filter: {
          page: requestAll.page,
          limit: requestAll.limit,
        },
      }
      //约定：把组装后的请求参数赋值给ctx.body，供service层调用
      ctx.body = body
      //调用service层来处理业务逻辑
      const result = await testService.test4(ctx)

      //组装获取到的数据。比如service获取到了10个字段，但前端只需用到4个，就在这里进行组装
      let data = result.data
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
        track: 'kl34jkfsdf98fv',
      })
    }
  }

  async testUtil(ctx) {
    try {
      //数组
      this.wrap(`str1`, `判断数组中是否包含某值（大小写敏感）`, `[1, 2].includes(2)`)
      this.wrap(`str1`, `判断数组中是否包含某值（大小写不敏感）`, `Util.arrIncludes(['a','b','c'],'B')`)
      this.wrap(`str1`, `截取数组, 从第1开始到第3之前的元素`, `['a', 'b', 'c', 'd'].slice(1, 3)`)
      this.wrap(`str1`, `截取数组`, `['a', 'b', 'c', 'd'].slice(['a', 'b', 'c', 'd'].indexOf('b'), ['a', 'b', 'c', 'd'].indexOf('d'))`)
      this.wrap(`str1`, `删除数组右边2个元素`, `['a', 'b', 'c', 'd'].slice(0,-2)`)
      this.wrap(`str1`, `返回从右边开始数，第n个位置开始的数组`, `Util.arrSliceLast([1, 2, 3], 2)`)
      this.wrap(`str1`, `返回数组中的最大值`, `Util.arrMax([1, 2, 3])`)
      this.wrap(`str1`, `返回数组中的最小值`, `Util.arrMin([1, 2, 3])`)
      this.wrap(`str1`, `将数组块平均拆分为指定大小的较小数组，返回一个二维数组。`, `Util.arrSplit([1, 2, 3, 4, 5], 2)`)
      this.wrap(`str1`, `计算数组中某个元素值的出现次数（大小写敏感）`, `Util.arrItemCount(['a', 'a', 'b'], 'a')`)
      this.wrap(`str1`, `返回去重后的数组`, `Util.arrNoDouble([1, 2, 2, 3])`)
      this.wrap(`str1`, `返回两个数组中相同的元素（注：大小写敏感）`, `Util.arrRetainDoubleCase([1, 2], [2, 3])`)
      this.wrap(`str1`, `返回两个数组中相同的元素（注：大小写不敏感）`, `Util.arrRetainDouble(['A', 'b', 'C'], ['c'])`)
      this.wrap(`str1`, `删除2个数组同时存在的元素，返回一个合并后的新数组`, `Util.arrDeleteDoubleAndUnion([1, 2], [2, 3])`)
      this.wrap(`str1`, `从A数组中删除AB数组同时存在的元素，返回一个新数组`, `Util.arrDeleteDouble([1, 2], [2, 3])`)
      this.wrap(`str1`, `2个数组合并、去重、返回一个新数组`, `Util.arrNoDoubleUnion([1, 2], [2, 3])`)
      this.wrap(`str1`, `删除指定的元素值（可多个），返回一个新数组`, `Util.arrDelete(['a','b','c','d','e'],'a','c')`)
      this.wrap(`str1`, `删除指定的元素值，返回原数组，原数组改变`, `Util.arrDeleteRaw(['a','b','c','d','e'],'d')`)
      this.wrap(`str1`, `把数组里的所有元素转成小写`, `Util.arr2LowerCase(['a','B'])`)
      this.wrap(`str1`, `随机返回数组中的一个元素值`, `Util.arrRandomValue([1,2,3])`)
      this.wrap(`str1`, `返回一个打乱了顺序的数组`, `Util.arrRandomSort([1,2,3])`)
      this.wrap(`str1`, `返回数组中每间隔n个的那些元素组成的数组`, `Util.arrEveryNth([1,2,3,4,5,6,7,8,9,10],3)`)
      this.wrap(`str1`, `返回数字数组的平均值(浮点数)`, `Util.arrAvg([3,6,7])`)
      this.wrap(`str1`, `返回一个数字数组的总和`, `Util.arrSum([1,2,3])`)
      this.wrap(`str1`, `返回给定数组中有多少个数小于或等于给定值的百分比%`, `Util.arrPercentIle([1,2,3,4],3)`)
      //字符串
      this.wrap(`str2`, `返回字符串长度`, `'abcd'.length`)
      this.wrap(`str2`, `返回字符串是否包含指定字符（大小写敏感）`, `'abcd'.includes('b')`)
      this.wrap(`str2`, `返回指定字符在字符串中的位置`, `'abcd'.indexOf('b')`)
      this.wrap(`str2`, `截取字符串，从第1开始到第3之前的字符串`, `'abcde'.slice(1,3)`)
      this.wrap(`str2`, `截取字符串，从第1开始到右边数第2个之前的字符串`, `'abcde'.slice(1,-2)`)
      this.wrap(`str2`, `返回字符串第n次出现的下标位置`, `Util.strIndexOfMulti('00ab00ab', 'ab', 2)`)
      this.wrap(`str2`, `返回字符串在某个字符串中出现的次数`, `Util.strCount('a23aaa23aa', '23')`)
      this.wrap(`str2`, `返回字符串中出现最多的字符和次数，返回json对象`, `Util.strFindMost('啊12啊啊啊3')`)
      this.wrap(`str2`, `清除字符串的任意空格`, `Util.strDeleteSpace('  he l lo  ')`)
      this.wrap(`str2`, `反转字符串`, `Util.strReverse('abc')`)
      this.wrap(`str2`, `按字母顺序排序`, `Util.strSort('badce')`)
      //日期
      //const moment = require('moment') //日期格式化插件
      //moment.locale('zh-cn') //设为北京时区
      //http://momentjs.cn/docs/#/displaying/format/
      this.wrap(`str3`, `格式化日期`, `moment(new Date('2019-1-1')).format("YYYY-MM-DD HH:mm:ss")`)
      this.wrap(`str3`, `日期减去10分钟`, `moment('2019-01-01 00:00:00').subtract(10, "minutes")`)
      this.wrap(`str3`, `日期加上10个月`, `moment('2019-01-01 00:00:00').add(10, "months").format("YYYY-MM-DD HH:mm:ss")`)
      this.wrap(`str3`, `2个日期相差多少间隔 a.diff(b, 'days')  ==  a - b`, `moment('2019-01-01 00:00:00').diff(moment('2019-01-01 01:00:00'),'minutes')`)
      this.wrap(`str3`, `是否是合法日期`, `moment('2019-13-02').isValid()`)
      this.wrap(`str3`, `日期转时间戳(毫秒)`, `moment('2019-06-12 12:30:10').valueOf()`)
      this.wrap(`str3`, `日期转时间戳(秒)`, `moment('2019-06-12 12:30:10').unix()`)
      this.wrap(`str3`, `时间戳(毫秒）转日期`, `moment(1560313810687).format('YYYY-MM-DD HH:mm:ss')`)
      this.wrap(`str3`, `获取当月的天数`, `moment().daysInMonth()`)
      this.wrap(`str3`, `获取指定月的天数`, `moment("2012-02", "YYYY-MM").daysInMonth()`)
      this.wrap(`str3`, `时间转数组`, `moment().toArray()`)
      this.wrap(`str3`, `时间转对象`, `moment().toObject()`)
      this.wrap(`str3`, `2个时间比较`, `moment('2010-10-20').isSame('2010-01-01', 'year')`)
      this.wrap(`str3`, `2个时间比较`, `moment('2010-10-20').isBefore('2010-12-31', 'year')`)
      this.wrap(`str3`, `2个时间比较`, `moment('2010-10-20').isAfter('2009-12-31', 'year')`)
      this.wrap(`str3`, `2个时间比较`, `moment('2010-10-20').isBetween('2009-12-31', '2012-01-01', 'year')`)
      this.wrap(`str3`, `是否是闰年`, `moment([2001]).isLeapYear()`)

      //对象
      this.wrap(`str4`, `json对象转字符串`, `JSON.stringify({a:1, b:2})`)
      this.wrap(`str4`, `字符串转json对象`, `JSON.parse('{"a":1,"b":2}')`)
      this.wrap(`str4`, `json对象深拷贝 let newObj = Util.deepClone({a:1, b: {c:3}})`, `Util.deepClone({a:1, b: {c:3}})`)
      this.wrap(`str4`, `是否有某个键（大小写敏感）`, `Util.objHas({aa:1}, 'aa')`)

      //类型检测
      this.wrap(`str5`, `是否是json对象`, `Util.isObj({aa:1})`)
      this.wrap(`str5`, `是否是空的json对象：{}`, `Util.isObjEmpty({aa:1})`)
      this.wrap(`str5`, `是否是数字类型`, `Util.isNumber({aa:1})`)
      this.wrap(`str5`, `是否是数组`, `Util.isArray([1,2])`)
      this.wrap(`str5`, `是否是函数`, `Util.isFunction({aa:1})`)
      this.wrap(`str5`, `是否是字符串`, `Util.isString('abc')`)

      let data = '<h2>常用工具库放在app/Lib/Util.js</h2><p>以下显示的返回值只是参考，以具体运行结果为准</p>'
      data += this.str1 + this.str2 + this.str3 + this.str4 + this.str5
      return data
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        code: 9000,
        track: 'k2j09faaj09',
      })
    }
  }

  /**
   * 演示get方法访问外部链接
   * @returns object
   */
  async testGet(ctx) {
    //调用service层来处理业务逻辑
    const result = await testService.httpGet(ctx)
    //返回结果给前端
    return Util.end2front({
      msg: result.msg,
      data: result.data,
    })
  }

  /**
   * 演示post方法访问外部链接
   * @returns object
   */
  async testPost(ctx) {
    //调用service层来处理业务逻辑
    const result = await testService.httpPost(ctx)
    //返回结果给前端
    return Util.end2front({
      msg: result.msg,
      data: result.data,
    })
  }

  /**
   * 演示session
   * @returns object
   */
  async testSession(ctx) {
    //session只能存字符串，所以对象、数组需要转成字符串
    const session = ctx.session
    //console.log(session.getSessionId())
    if (!session.get('user')) {
      //如果找不到，则赋值
      console.log('赋新值')
      let data = {
        name: 'admin',
        age: '18',
        time: new Date().getTime(),
      }
      session.put('user', data)
    }
    let userInfo = session.get('user')
    console.log(userInfo)
    //session.forget('user') //删除
    //session.clear()//清空

    return Util.end({
      data: userInfo,
    })
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
  /**
   * 辅助函数，用来包装一层div
   * @example
   *
   * @returns object
   */
  wrap(str, desc, func) {
    this[str] += `<div style="margin-bottom:1rem"><li>${desc}</li><div style="padding-left:2rem"><span style="color:green">${func}</span> : <span style="">${eval(
      func
    )}</span></div></div>`
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
            body.set.user_name = bodyRaw[k]
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
        user_name: 'required|alpha_numeric',
        beginDate: 'date|after:2019-10-01',
        age: 'number|above:10',
        data: 'json', //data={"a":"1"},data的值能被JSON.parse(data)
        sex: 'in:1,2',
        status: 'equals:1',
        password: 'min:6|max:10',
        rePassword: 'same:password',
      }
      const messages = {
        'user_name.required': '用户名为必填项',
        'user_name.alpha_numeric': '用户名应为字母和数字',
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
