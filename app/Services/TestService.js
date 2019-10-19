'use strict'

const Http = require('../Lib/Http')
const Util = require('../Lib/Util')

const Database = use('Database')
const log = use('Logger')

class TestService {
  async test1(ctx) {
    return 'abc'
  }

  async httpGet() {
    try {
      const url = 'http://api.m.taobao.com/rest/api.do?api=mtop.common.getTimestamp'
      const result = await Http.get(url, { aa: '1234' }, { timeout: 50 }) //timeout ??
      if (result.fail) {
        throw new Error(JSON.stringify(result))
      }
      return result
    } catch (err) {
      log.notice('kj230rj09293j')
      log.error(err)
      return err
    }
  }

  async httpPost() {
    try {
      //let url = 'http://127.0.0.1:3333/test2'
      let url = 'https://media.mz4s.com/mp/port-msg-box'
      let result = await Http.post(url, { account: '123467', error_msg: 'dd' })
      if (result.fail) {
        throw new Error(result.msg)
      }
      return result
    } catch (err) {
      log.error(err.message)
      return null
    }
  }
}

module.exports = TestService
