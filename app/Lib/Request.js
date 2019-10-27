'use strict'

const axios = require('axios')
const log = use('Logger')
const Util = require('./Util')

const Request = {
  async get(url, params = {}, more = {}) {
    try {
      let { ...config } = more
      config.params = params
      let result = await axios.get(url, config)
      return Util.end({
        data: result.data,
      })
    } catch (err) {
      let msg = ''
      if (!!err.response) {
        msg = `接收响应出错: ${url}`
      } else if (!!err.request) {
        msg = `发送请求出错: ${url}`
      } else if (err.message.includes('timeout')) {
        msg = `请求超时： ${url}`
      } else {
        msg = err.message
      }
      return Util.error({
        msg: msg,
        track: '209jf9034',
      })
    }
  },

  async post(url, params = {}, more = {}) {
    try {
      let { ...config } = more
      let result = await axios.post(url, params, config)
      return Util.end({
        data: result.data,
      })
    } catch (err) {
      let msg = ''
      if (!!err.response) {
        msg = `接收响应出错: ${url}`
      } else if (!!err.request) {
        msg = `发送请求出错: ${url}`
      } else if (err.message.includes('timeout')) {
        msg = `请求超时： ${url}`
      } else {
        msg = err.message
      }
      return Util.error({
        msg: msg,
        track: 'j28f2930',
      })
    }
  },
}

module.exports = Request
