'use strict'

const Http = require('../Lib/Http')
const U = require('../Lib/Util')

const Database = use('Database')
const log = use('Logger')

class TestService {
  async test1(ctx) {
    return 'abc'
  }

  async httpGet() {
    try {
      const url = 'http://api.m.taobao.com/rest/api.do?api=mtop.common.getTimestamp'
      const result = await Http.get(url, { aa: '1234' }, { timeout: 5000 }) //timeout ??
      if (result.fail) {
        throw new Error(result.msg)
      }
      return result
    } catch (err) {
      log.notice('kj230rj09293j')
      return {
        fail: true,
        msg: err.message,
      }
    }
  }

  async httpPost() {
    try {
      const url = 'https://media.mz4s.com/mp/port-msg-box'
      const result = await Http.post(url, { account: '123467', error_msg: 'dd' }, { timeout: 5000 })
      if (result.fail) {
        throw new Error(result.msg)
      }
      return result
    } catch (err) {
      log.notice('98457t9f49f')
      return {
        fail: true,
        msg: err.message,
      }
    }
  }
}

module.exports = TestService
