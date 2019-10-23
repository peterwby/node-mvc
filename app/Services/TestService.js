'use strict'

const Http = require('../Lib/Http')
const Util = require('../Lib/Util')
const Database = use('Database')
const log = use('Logger')

class TestService {
  async test1(ctx) {
    return 'abc'
  }

  async createDb(ctx) {
    try {
      const TestTable = require('../Models/Table/test')
      const testTable = new TestTable('test')
      let result = {}
      //执行事务
      await Database.transaction(async trx => {
        //是否已存在
        //创建一条记录
        let data = ctx.body
        result = await testTable.create(trx, data)
      })
      return result
    } catch (err) {
      return Util.error({
        msg: '创建失败',
        track: 'kxxjkl32',
      })
    }
  }

  async updateDb(ctx) {
    try {
      const TestTable = require('../Models/Table/test')
      const testTable = new TestTable('test')
      let result = {}
      //执行事务
      await Database.transaction(async trx => {
        //是否已存在
        //创建一条记录
        let set = ctx.body.set
        let id = ctx.body.id
        let data = { id, set }
        result = await testTable.updateById(trx, data)
      })
      return result
    } catch (err) {
      return Util.error({
        msg: '创建失败',
        track: 'kxxjkl32',
      })
    }
  }

  async findDb(ctx) {
    try {
      const TestTable = require('../Models/Table/test')
      const testTable = new TestTable('test')
      let result = {}

      let cols = ['userName', 'status']
      let id = ctx.body.id
      let data = { id, cols }
      result = await testTable.findById(data)

      return result
    } catch (err) {
      return Util.error({
        msg: '查询失败',
        track: '324jkl32',
      })
    }
  }

  async httpGet() {
    try {
      const url = 'http://api.m.taobao.com/rest/api.do?api=mtop.common.getTimestamp'
      const result = await Http.get(url, { aa: '1234' }, { timeout: 5000 }) //timeout ??
      if (result.fail) {
        throw new Error('访问http出错')
      }
      let data = result //组装数据
      return Util.success(data)
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: '94jf902',
      })
    }
  }

  async httpPost() {
    try {
      const url = 'https://media.mz4s.com/mp/port-msg-box'
      const result = await Http.post(url, { account: '123467', error_msg: 'dd' }, { timeout: 5000 })
      if (result.fail) {
        throw new Error(result.msg)
      }
      return Util.success(result)
    } catch (err) {
      return Util.error({
        msg: err.message,
      })
    }
  }
}

module.exports = TestService
