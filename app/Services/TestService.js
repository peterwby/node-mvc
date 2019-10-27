'use strict'

const Database = use('Database')
const log = use('Logger')
const Request = require('../Lib/Request')
const Util = require('../Lib/Util')
const Tables = require('../Models/Tables')

class TestService {
  async test1(ctx) {
    return 'abc'
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
        let isExistUserName = await Tables.test.isExistByName({ username: data.userName })
        if (isExistUserName) {
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
        track: '8093j4gj',
      })
    }
  }

  async updateDb(ctx) {
    try {
      let result = {}
      //执行事务
      await Database.transaction(async trx => {
        //更新一条记录
        let set = ctx.body.set
        let id = ctx.body.id
        let data = { id, set }
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

  async findDb(ctx) {
    try {
      let result = {}

      let cols = ['userName', 'status']
      let id = ctx.body.id
      let data = { id, cols }
      result = await Tables.test.findById(data)

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
      if (result.error) {
        throw new Error('访问http出错')
      }
      let data = result
      //组装数据

      return Util.end(data)
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
      const result = await Request.post(url, { account: '123467', error_msg: 'dd' }, { timeout: 5000 })
      if (result.error) {
        throw new Error(result.msg)
      }
      return Util.end(result)
    } catch (err) {
      return Util.error({
        msg: err.message,
      })
    }
  }
}

module.exports = TestService
