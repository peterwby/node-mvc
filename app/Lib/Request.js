'use strict'

const axios = require('axios')
const log = use('Logger')
const Util = require('./Util')
const uuidv4 = require('uuid/v4')
const Redis = use('Redis')
const Env = use('Env')

const Request = {
  /**
   * get方式访问远程url，并返回结果
   * @example
   * await Request.get('http://xxx',{ id:1 })
   * await Request.get('http://xxx',{ id:1 }, {
   *  headers: {'键': '值'},
   *  timeout: 5000
   * })
   * await Request.get('http://xxx',{ id:1 }, { token })
   * @returns object
   */
  async get(url, params = {}, config = {}) {
    try {
      if (config.token) {
        const token_name = Env.get('API_TOKEN_NAME')
        if (!config.headers) {
          config.headers = {}
        }
        config.headers[token_name] = config.token
        delete config.token
      }
      config.params = params
      let result = await axios.get(url, config)

      return Util.end({
        data: result.data,
        code: result.status,
      })
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
        track: 'request.get_209jf9034',
      })
    }
  },

  /**
   * post方式访问远程url，并返回结果
   * @example
   * await Request.post('http://xxx',{ id:1 })
   * await Request.post('http://xxx',{ id:1 }, {
   *  headers: {'键': '值'},
   *  timeout: 5000
   * })
   * await Request.post('http://xxx',{ id:1 }, { token })
   * @returns object
   */
  async post(url, params = {}, config = {}) {
    try {
      if (config.token) {
        const token_name = Env.get('API_TOKEN_NAME')
        if (!config.headers) {
          config.headers = {}
        }
        config.headers[token_name] = config.token
        delete config.token
      }
      config.maxContentLength = 100 * 1024 * 1024 //让axios支持上传100M大文件
      let result = await axios.post(url, params, config)
      return Util.end({
        data: result.data,
        code: result.status,
      })
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
        data: {
          errno: err.errno,
          code: err.code,
        },
        track: 'request.post_j28f2930',
      })
    }
  },

  /**
   * 调用远程函数，有带redis验证，并返回执行结果。
   * @example
   * await Request.call(url,{ name:'wu' })
   * await Request.call(url,{ name:'wu' }, {
   *  headers: {'键': '值'},
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
      return Util.end({
        data: result.data,
        code: result.status,
      })
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
        track: 'call_j28f2930',
      })
    }
  },
}

module.exports = Request
