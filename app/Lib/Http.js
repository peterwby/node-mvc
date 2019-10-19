'use strict'

const axios = require('axios')
const log = use('Logger')

const Http = {
  async get(url, data = null, more = {}) {
    try {
      let { ...config } = more
      if (!!data) {
        config.params = data
      }
      let result = await axios.get(url, config)
      return {
        fail: false,
        msg: 'success',
        data: result.data,
      }
    } catch (err) {
      log.error(err)
      let msg = ''
      if (!!err.response) {
        msg = `接收响应出错: ${url}`
      } else if (!!err.request) {
        if (err.message.includes('timeout')) {
          msg = `请求超时： ${url}`
        } else {
          msg = `发送请求出错: ${url}`
        }
      } else {
        //其他错误
        msg = err.message
      }
      return {
        fail: true,
        msg: msg,
      }
    }
  },

  async post(url, data = {}, more = {}) {
    try {
      let { ...config } = more
      let result = await axios.post(url, data, config)
      return {
        fail: false,
        msg: 'success',
        data: result.data,
      }
    } catch (err) {
      let msg = ''
      if (!!err.response) {
        msg = `接收响应出错: ${url}`
      } else if (!!err.request) {
        msg = `发送请求出错: ${url}`
      } else {
        //其他错误
        msg = err.message
      }
      return {
        fail: true,
        msg: msg,
      }
    }
  },
}

module.exports = Http
