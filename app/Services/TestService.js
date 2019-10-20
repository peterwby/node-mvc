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
