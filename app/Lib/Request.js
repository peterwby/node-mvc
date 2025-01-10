'use strict'

const axios = require('axios')
const axiosRetry = require('axios-retry')
const log = use('Logger')
const Util = require('./Util')
const uuidv4 = require('uuid/v4')
const Redis = use('Redis')
const Env = use('Env')

// 创建默认配置
const defaultConfig = {
  timeout: 30000, // 默认30秒超时
  retries: 3, // 默认重试3次
  retryDelay: (retryCount) => {
    // 使用自定义的退避算法
    return Math.min(1000 * Math.pow(2, retryCount), 10000) // 最大间隔10秒
  },
  maxContentLength: 100 * 1024 * 1024, // 默认最大100M
  maxBodyLength: 100 * 1024 * 1024, // 默认最大100M
}

const Request = {
  /**
   * 创建配置了重试机制的axios实例
   * @private
   */
  _createAxiosInstance(customConfig = {}) {
    try {
      // 确保超时时间不会太小
      const timeout = Math.max(customConfig.timeout || defaultConfig.timeout, 1000)

      // 创建新的axios实例，合并默认配置
      const instance = axios.create({
        timeout,
        maxContentLength: customConfig.maxContentLength || defaultConfig.maxContentLength,
        maxBodyLength: customConfig.maxBodyLength || defaultConfig.maxBodyLength,
        validateStatus: function (status) {
          return status >= 200 && status < 300
        },
      })

      // 清理可能存在的拦截器
      instance.interceptors.request.handlers = []
      instance.interceptors.response.handlers = []

      // 配置重试
      const retryCount = typeof customConfig.retries === 'number' ? Math.min(Math.max(customConfig.retries, 1), 10) : defaultConfig.retries

      axiosRetry(instance, {
        retries: retryCount,
        retryDelay: (retryNumber) => {
          const delay = Math.min(1000 * Math.pow(2, retryNumber - 1), 10000)
          log.debug(`请求重试 [${retryNumber}/${retryCount}] ${delay}ms后重试`)
          return delay
        },
        retryCondition: (error) => {
          // 提取关键错误信息
          const errorInfo = {
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            params: error.config?.params,
            data: error.config?.data,
            errorCode: error.code,
            errorMessage: error.message,
            statusCode: error.response?.status,
          }

          log.debug('请求错误:', errorInfo)

          // 以下情况进行重试：
          // 1. 网络错误或幂等请求错误（GET, HEAD, OPTIONS, PUT, DELETE）
          // 2. 请求超时 (ECONNABORTED)
          // 3. 服务器错误 (5xx)
          const shouldRetry =
            axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED' || (error.response && error.response.status >= 500)

          // 记录重试决定
          if (shouldRetry) {
            const retryCount = (error.config?.['axios-retry']?.retryCount || 0) + 1
            log.debug(`将进行第 ${retryCount} 次重试`)
          }

          return shouldRetry
        },
        shouldResetTimeout: true, // 重要：每次重试都重置超时时间
      })

      return instance
    } catch (err) {
      log.error('创建axios实例失败:', err)
      throw err
    }
  },

  /**
   * 处理请求配置
   * @private
   */
  _handleRequestConfig(config = {}) {
    const requestConfig = { ...config }
    const retryConfig = {}

    // 处理token
    if (requestConfig.token) {
      const token_name = Env.get('API_TOKEN_NAME')
      if (!requestConfig.headers) {
        requestConfig.headers = {}
      }
      requestConfig.headers[token_name] = requestConfig.token
      delete requestConfig.token
    }

    // 提取重试相关配置
    if (requestConfig.retries !== undefined) {
      retryConfig.retries = requestConfig.retries
      delete requestConfig.retries
    }
    if (requestConfig.retryDelay !== undefined) {
      retryConfig.retryDelay = requestConfig.retryDelay
      delete requestConfig.retryDelay
    }
    if (requestConfig.timeout !== undefined) {
      retryConfig.timeout = requestConfig.timeout
      delete requestConfig.timeout
    }
    // 处理文件大小限制
    if (requestConfig.maxContentLength !== undefined) {
      retryConfig.maxContentLength = requestConfig.maxContentLength
      delete requestConfig.maxContentLength
    }
    if (requestConfig.maxBodyLength !== undefined) {
      retryConfig.maxBodyLength = requestConfig.maxBodyLength
      delete requestConfig.maxBodyLength
    }

    return { requestConfig, retryConfig }
  },

  /**
   * 格式化错误信息
   * @private
   */
  _formatErrorMessage(err, url) {
    const retryCount = err.config?.['axios-retry']?.retryCount || 0
    const retryInfo = retryCount > 0 ? `（已重试${retryCount}次）` : ''

    // 截断长字符串的辅助函数
    const truncateString = (str, maxLength = 200) => {
      if (typeof str !== 'string') {
        str = JSON.stringify(str)
      }
      return str.length > maxLength ? str.slice(0, maxLength) + '...' : str
    }

    // 提取关键错误信息
    const errorDetails = {
      method: err.config?.method?.toUpperCase(),
      params: err.config?.params ? truncateString(err.config.params) : undefined,
      data: err.config?.data ? truncateString(err.config.data) : undefined,
      statusCode: err.response?.status,
      errorCode: err.code,
      errorMessage: err.message,
    }

    let msg = ''
    if (err.response) {
      msg = `接收响应出错: ${url} [状态码:${errorDetails.statusCode}]${retryInfo}`
      if (err.response.data) {
        const responseData = typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data.toString()
        log.debug('响应数据:', truncateString(responseData))
      }
    } else if (err.request) {
      msg = `发送请求出错: ${url} [错误码:${errorDetails.errorCode}]${retryInfo}`
      log.debug('请求详情:', errorDetails)
    } else if (err.message.includes('timeout')) {
      msg = `请求超时: ${url} [${err.config.timeout}ms]${retryInfo}`
    } else {
      msg = `${err.message} [${url}]${retryInfo}`
    }

    // 记录完整错误信息
    log.debug('错误详情:', errorDetails)

    return msg
  },

  /**
   * get方式访问远程url
   */
  async get(url, params = {}, config = {}) {
    let instance = null
    try {
      const { requestConfig, retryConfig } = this._handleRequestConfig(config)
      requestConfig.params = params

      // 每次请求创建新实例
      instance = this._createAxiosInstance(retryConfig)
      const result = await instance.get(url, requestConfig)

      return Util.end({
        data: result.data,
        code: result.status,
      })
    } catch (err) {
      const msg = this._formatErrorMessage(err, url)
      log.error(`GET请求失败: ${msg}`)
      return Util.error({
        msg,
        code: 500,
        track: 'request.get_' + Date.now(),
      })
    } finally {
      // 确保实例被清理
      instance = null
    }
  },

  /**
   * post方式访问远程url
   */
  async post(url, params = {}, config = {}) {
    let instance = null
    try {
      const { requestConfig, retryConfig } = this._handleRequestConfig(config)

      // 每次请求创建新实例
      instance = this._createAxiosInstance(retryConfig)
      const result = await instance.post(url, params, requestConfig)

      return Util.end({
        data: result.data,
        code: result.status,
      })
    } catch (err) {
      const msg = this._formatErrorMessage(err, url)
      log.error(`POST请求失败: ${msg}`)
      return Util.error({
        msg,
        data: {
          errno: err.errno,
          code: (err.response ? err.response.status : err.code) || 500,
        },
        code: 500,
        track: 'request.post_' + Date.now(),
      })
    } finally {
      // 确保实例被清理
      instance = null
    }
  },

  /**
   * 使用示例
   * @example
   * // 1. 基础请求
   * // GET请求
   * const result1 = await Request.get('http://api.example.com/users')
   *
   * // POST请求
   * const result2 = await Request.post('http://api.example.com/users', {
   *   username: 'test',
   *   email: 'test@example.com'
   * })
   *
   * // 2. 带查询参数的GET请求
   * const result3 = await Request.get('http://api.example.com/users', {
   *   page: 1,
   *   limit: 10,
   *   status: 'active'
   * })
   *
   * // 3. 自定义请求头
   * const result4 = await Request.post('http://api.example.com/users', data, {
   *   headers: {
   *     'Content-Type': 'application/json',
   *     'X-Custom-Header': 'custom-value'
   *   }
   * })
   *
   * // 4. 超时和重试配置
   * const result5 = await Request.get('http://api.example.com/users', {}, {
   *   timeout: 5000,        // 5秒超时
   *   retries: 3,          // 最多重试3次
   * })
   *
   * // 5. 带token的请求
   * const result6 = await Request.get('http://api.example.com/users', {}, {
   *   token: 'your-token-here'  // 会自动添加到请求头
   * })
   *
   * // 6. 上传大文件
   * const result7 = await Request.post('http://api.example.com/upload', formData, {
   *   timeout: 60000,                       // 60秒超时
   *   maxContentLength: 100 * 1024 * 1024,  // 响应最大100M
   *   maxBodyLength: 100 * 1024 * 1024,     // 请求最大100M
   *   headers: {
   *     'Content-Type': 'multipart/form-data'
   *   }
   * })
   *
   * // 7. 完整配置示例
   * const result8 = await Request.post('http://api.example.com/data',
   *   {
   *     // 请求数据
   *     name: 'test',
   *     type: 'example'
   *   },
   *   {
   *     // 请求配置
   *     timeout: 5000,        // 5秒超时
   *     retries: 3,          // 最多重试3次
   *     headers: {           // 自定义请求头
   *       'X-Custom-Header': 'value',
   *       'Accept-Language': 'zh-CN'
   *     },
   *     token: 'your-token', // API token
   *     maxContentLength: 50 * 1024 * 1024,  // 响应最大50M
   *     maxBodyLength: 50 * 1024 * 1024      // 请求最大50M
   *   }
   * )
   *
   * // 8. 错误处理示例
   * try {
   *   const result = await Request.get('http://api.example.com/users')
   *   // 成功处理
   *   console.log(result.data)
   * } catch (err) {
   *   // 错误处理
   *   if (err.code === 'ECONNABORTED') {
   *     console.log('请求超时')
   *   } else if (err.response) {
   *     console.log('服务器返回错误:', err.response.status)
   *   } else if (err.request) {
   *     console.log('请求发送失败')
   *   }
   * }
   *
   */
}

module.exports = Request
