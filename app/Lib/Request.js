'use strict'

const axios = require('axios')
const log = use('Logger')
const Util = require('./Util')
const uuidv4 = require('uuid/v4')
const Redis = use('Redis')

const Request = {
  /**
   * get方式访问远程url，并返回结果
   * @example
   * await Request.get('http://xxx',{ id:1 })
   * await Request.get('http://xxx',{ id:1 }, {
   *  header: {'键': '值'},
   *  timeout: 5000
   * })
   * @returns object
   */
  async get(url, params = {}, more = {}) {
    try {
      let { ...config } = more
      config.params = params
      let result = await axios.get(url, config)
      return Util.end(result.data)
    } catch (err) {
      let msg = ''
      if (err.response) {
        msg = `接收响应出错: ${url}`
      } else if (err.request) {
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

  /**
   * post方式访问远程url，并返回结果
   * @example
   * await Request.post('http://xxx',{ id:1 })
   * await Request.post('http://xxx',{ id:1 }, {
   *  header: {'键': '值'},
   *  timeout: 5000
   * })
   * @returns object
   */
  async post(url, params = {}, more = {}) {
    try {
      let { ...config } = more
      let result = await axios.post(url, params, config)
      return Util.end(result.data)
    } catch (err) {
      let msg = ''
      if (err.response) {
        msg = `接收响应出错: ${url}`
      } else if (err.request) {
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

  /**
   * 调用远程函数，执行数据库处理，并返回结果。用于Service调用Model。
   * @example
   * await Request.call(url,{ name:'wu' })
   * await Request.call(url,{ name:'wu' }, {
   *  header: {'键': '值'},
   *  timeout: 5000
   * })
   * @param redisKey 可选，用来把对象存到redis中，做识别身份用
   * @returns object
   */
  async call(url, params = {}, more = {}, redisKey = {}) {
    try {
      const rndKey = uuidv4()
      await Redis.set(rndKey, JSON.stringify(redisKey))
      params.rk = rndKey
      let { ...config } = more
      let result = await axios.post(url, params, config)
      return Util.end(result.data)
    } catch (err) {
      let msg = ''
      if (err.response) {
        msg = `接收响应出错: ${url}
        status: ${err.response ? err.response.status : 0}
        statusText: ${err.response ? err.response.statusText : ''}`
      } else if (err.request) {
        msg = `发送请求出错: ${url}`
      } else if (err.message.includes('timeout')) {
        msg = `请求超时： ${url}
        status: ${err.response ? err.response.status : 0}
        statusText: ${err.response ? err.response.statusText : ''}`
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
