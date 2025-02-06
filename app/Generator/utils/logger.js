'use strict'

const { ERROR_CODES, ERROR_MESSAGES, GeneratorError } = require('../core/errors')
const crypto = require('crypto')

/**
 * 日志工具类
 */
class Logger {
  constructor(options = {}) {
    this.debug_enabled = options.debug_enabled || process.env.NODE_ENV === 'development'
    this.module = options.module || 'unknown'
  }

  /**
   * 记录信息级别日志
   * @param {string} message - 日志消息
   * @param {Object} [data] - 相关数据
   * @returns {Logger} 当前实例，支持链式调用
   */
  info(message, data = null) {
    this._log('INFO', message, data)
    return this
  }

  /**
   * 记录调试级别日志
   * @param {string} message - 日志消息
   * @param {Object} [data] - 相关数据
   * @returns {Logger} 当前实例，支持链式调用
   */
  debug(message, data = null) {
    if (!this.debug_enabled) return this
    this._log('DEBUG', message, data)
    return this
  }

  /**
   * 记录错误级别日志
   * @param {string|Error|GeneratorError} error - 错误对象或错误消息
   * @param {string} [code] - 错误代码（如果error不是GeneratorError时使用）
   * @param {Object} [extra={}] - 额外信息
   * @returns {Logger} 当前实例，支持链式调用
   */
  error(error, code = ERROR_CODES.UNKNOWN, extra = {}) {
    let logData = {
      time: new Date().toISOString(),
      level: 'ERROR',
      module: this.module,
      ...extra,
    }

    // 如果是 GeneratorError，直接使用其信息
    if (error instanceof GeneratorError) {
      logData = {
        ...logData,
        message: error.message,
        code: error.code,
        track: error.track,
        stack: error.stack,
      }
    }
    // 如果是普通 Error，包装成 GeneratorError
    else if (error instanceof Error) {
      const track = error.track || this._generateTrack(`${this.module.toLowerCase()}_error`)
      logData = {
        ...logData,
        message: error.message,
        code: error.code || code,
        track: track,
        stack: error.stack,
      }
    }
    // 如果是字符串或其他对象，创建新的错误信息
    else {
      const track = error.track || this._generateTrack(`${this.module.toLowerCase()}_error`)
      logData = {
        ...logData,
        message: error.message || error,
        code: error.code || code,
        track: track,
        stack: error.stack,
      }
    }

    // 处理额外数据
    if (extra) {
      try {
        const { code: _, track: __, stack: ___, ...restData } = extra
        if (Object.keys(restData).length > 0) {
          // 处理循环引用
          logData.data = JSON.parse(JSON.stringify(restData))
        }
      } catch (err) {
        // 如果数据处理失败，记录原始错误
        logData.data = {
          error: '数据包含循环引用或无法序列化的内容',
          partial_data: Object.keys(extra),
        }
      }
    }

    // 输出日志
    console.error(JSON.stringify(logData, null, 2))

    // 保存最后一次错误日志数据
    this.lastErrorData = logData

    return this
  }

  /**
   * 获取最后一次错误日志数据
   * @returns {Object|null} 最后一次错误日志数据
   */
  getLastError() {
    return this.lastErrorData || null
  }

  /**
   * 生成追踪ID
   * @private
   * @param {string} type - 追踪类型
   * @returns {string} 追踪ID
   */
  _generateTrack(type) {
    const timestamp = Date.now()
    const random = crypto.randomBytes(4).toString('hex')
    return `${this.module.toLowerCase()}_${type}_${timestamp}_${random}`
  }

  /**
   * 内部日志记录方法
   * @private
   */
  _log(level, message, data = null) {
    const log = {
      time: new Date().toISOString(),
      level,
      module: this.module,
      message,
    }

    if (data) {
      try {
        // 如果数据中包含错误代码，将其提升到顶层
        if (data.code) {
          log.code = data.code
        }
        // 如果数据中包含追踪ID，将其提升到顶层
        if (data.track) {
          log.track = data.track
        }
        // 如果数据中包含堆栈信息，将其提升到顶层
        if (data.stack) {
          log.stack = data.stack
        }
        // 其他数据放在 data 字段中
        const { code, track, stack, ...restData } = data
        if (Object.keys(restData).length > 0) {
          // 处理循环引用
          log.data = JSON.parse(JSON.stringify(restData))
        }
      } catch (err) {
        // 如果数据处理失败，记录原始错误
        log.data = {
          error: '数据包含循环引用或无法序列化的内容',
          partial_data: Object.keys(data),
        }
      }
    }

    // 根据日志级别使用不同的输出方法
    const output = JSON.stringify(log, null, 2)
    switch (level) {
      case 'ERROR':
        console.error(output)
        break
      case 'DEBUG':
        console.debug(output)
        break
      default:
        console.log(output)
    }

    return log
  }

  /**
   * 记录警告信息
   * @param {string} message - 警告消息
   * @param {Object} [data] - 附加数据
   */
  warn(message, data) {
    this._log('WARN', message, data)
    return this
  }
}

module.exports = Logger
