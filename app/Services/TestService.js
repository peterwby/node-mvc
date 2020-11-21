'use strict'

const Database = use('Database')
const log = use('Logger')
const Request = require('@Lib/Request')
const Util = require('@Lib/Util')
const BaseService = require('@BaseClass/BaseService')
const Ws = use('Ws')

class TestService extends BaseService {
  // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  // XXXX       3个由浅入深的例子                 XXXX
  // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  /**
   * 返回hello world，并打印到控制台
   * @example
   * await test1(ctx)
   * @returns object
   */
  async test1(ctx) {
    try {
      let msg = `hello world`
      var obj = { name: '张三', class: { className: 'class1' }, classMates: [{ name: 'lily' }] }
      console.log(Util.obj2url(obj))
      log.info(msg)
      return Util.end({ msg: msg })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: '000000',
      })
    }
  }

  /**
   * 新建一条记录
   * @example
   * await test2(ctx)
   * @description
   * 说明：“增、改、删”都需在事务内进行。这样，当事务内部抛出错误时，会回滚对数据库的操作。
   * @returns object
   */
  async test2(ctx) {
    try {
      let result = {}
      //引用Model里的类并初始化
      const TestTable = require('@Table/test')
      const testTable = new TestTable()

      //使用事务
      await Database.transaction(async (trx) => {
        //调用models层，插入一条记录到数据库
        //ctx.body：为“前端的请求”经过检验、组装后的对象
        //test表本身没有实现create方法，但它的基类BaseTable实现了此方法，故可直接使用
        result = await testTable.create(trx, ctx.body)

        result = await testTable.createMany(trx, [
          { user_name: 'chen', status: 1 },
          { user_name: 'wu', status: 0 },
          { user_name: 'chen22', status: 1 },
          { user_name: 'wu22', status: 0 },
        ])

        result = await testTable.updateAdd(trx, {
          add: ['age', 2],
          where: [['id', '=', '10']],
        })

        result = await testTable.deleteBy(trx, { where: [['id', '=', 13]] })

        result = await testTable.updateBy(trx, {
          where: [
            ['id', '>', 20],
            ['id', '<', 40],
          ],
          set: { user_name: 'abc', status: 0, age: 20 },
        })
      })
      return Util.end(result)
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'kj203jf903',
      })
    }
  }

  /**
   * 从数据库中读取一些记录
   * @example
   * await test3(ctx)
   * @returns object
   */
  async test3(ctx) {
    try {
      //引用Model里的类并初始化
      const JoinTable = require('@Join')
      const joinTable = new JoinTable()
      let result = {}
      result = await joinTable.fetchTest3By(ctx.body)

      return Util.end(result)
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: '3490fjjakjkd',
      })
    }
  }

  async test4(ctx) {
    try {
      let body = ctx.body
      let page = body.filter.page || 1
      let limit = body.filter.limit || 10

      const TestTable = require('@Table/test')
      const testTable = new TestTable()
      let result = {}

      result = await testTable.fetchAll({
        //where: [['status', '=', '1']],
        whereIn: ['id', [10, 11, 12]],
        whereNotNull: ['age'],
        column: ['user_name', 'status'],
        orderBy: [
          ['user_name', 'desc'],
          ['status', 'asc'],
        ],
        page,
        limit,
      })
      /*
      result = await testTable.checkExistById(1)

      result = await testTable.fetchOneById(10)

      result = await testTable.fetchCount({
        where: [['status', '=', '1']],
      })

      result = await testTable.fetchMin({
        column: 'id',
        where: [['status', '=', '1']],
      })

      */

      return Util.end({
        data: result.data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: '34twedf23e',
      })
    }
  }

  async httpGet() {
    try {
      const url = 'http://api.m.taobao2.com/rest/api.do?api=mtop.common.getTimestamp'
      const result = await Request.get(url, { aa: '1234' }, { timeout: 5000 }).catch((err) => {
        console.log(err.message)
        return Util.end({})
      })
      //组装数据
      return Util.end({ data: result.data })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: '94jf902',
      })
    }
  }

  async httpPost(ctx) {
    try {
      const url = 'http://api.m.taobao.com/rest/api.do?api=mtop.common.getTimestamp'
      const result = await Request.post(url, { account: '123467', error_msg: 'dd' }, { timeout: 5000 }).catch((err) => {
        console.log(err.message)
        return Util.end({})
      })

      return Util.end({ data: result })
    } catch (err) {
      return Util.error({
        msg: err.message,
      })
    }
  }

  async pushMsg(ctx) {
    try {
      let result = {}
      const { body } = ctx
      const channel = Ws.getChannel('notice:*')
      if (!channel) {
        return Util.end2front({
          msg: '没有用户在线',
          code: 9000,
        })
      }
      const topic = channel.topic('notice:news')
      if (!topic) {
        return Util.end2front({
          msg: '没有用户在线',
          code: 9000,
        })
      }
      topic.broadcast('user....', 'msg...')
      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_pushMsg_1605956980',
      })
    }
  }
}

module.exports = TestService
