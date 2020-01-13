'use strict'

const Database = use('Database')
const log = use('Logger')
const Request = require('@Lib/Request')
const Util = require('@Lib/Util')
const BaseService = require('@BaseClass/BaseService')

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
    let msg = `hello world`
    log.info(msg)
    return Util.end({ msg: msg })
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
      await Database.transaction(async trx => {
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
          add: ['age', 1],
          where: [['id', '=', '10']],
        })

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

  // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  // XXXX       以下还在修改中                    XXXX
  // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  async fetchProd(ctx) {
    const cheerio = require('cheerio')
    const superagent = require('superagent')

    let res = await superagent.get('https://www.baidu.com').timeout(30000)
    let $ = cheerio.load(res.text)

    return Util.end({
      msg: '任务结束了',
    })
  }

  /**
   * 创建
   * @example
   * createDb(ctx)
   * @returns object
   */
  async createDb(ctx) {
    try {
      let result = {}
      //执行事务
      await Database.transaction(async trx => {
        let data = ctx.body
        //是否已存在
        result = await Tables.test.checkExistByName({ username: data.userName })

        if (result.data.isExist) {
          return Util.end({
            msg: '已存在此名字',
            status: 0,
          })
        }
        //创建一条记录
        result = await Tables.test.create(trx, data)
      })
      return Util.end(result)
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'sdkfj903j490j',
      })
    }
  }

  async updateDb(ctx) {
    try {
      let result = {}
      //执行事务
      await Database.transaction(async trx => {
        //更新一条记录
        let data = {
          id: ctx.body.id,
          set: ctx.body.set,
        }
        result = await Tables.test.updateById(trx, data)
      })
      return Util.end(result)
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'kajdf09gj34',
      })
    }
  }

  async fetchDb(ctx) {
    try {
      let result = {}

      let cols = ['userName', 'status']
      let id = ctx.body.id
      let data = { id, cols }
      result = await Tables.test.fetchById(data)

      return Util.end(result)
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: '324jkl32',
      })
    }
  }

  async httpGet() {
    try {
      const url = 'http://api.m.taobao.com/rest/api.do?api=mtop.common.getTimestamp'
      const result = await Request.get(url, { aa: '1234' }, { timeout: 5000 }) //timeout ??

      //组装数据
      return Util.end({ data: result })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: '94jf902',
      })
    }
  }

  async httpPost() {
    try {
      const url = 'http://api.m.taobao.com/rest/api.do?api=mtop.common.getTimestamp'
      const result = await Request.post(url, { account: '123467', error_msg: 'dd' }, { timeout: 5000 })

      return Util.end({ data: result })
    } catch (err) {
      return Util.error({
        msg: err.message,
      })
    }
  }
}

module.exports = TestService
