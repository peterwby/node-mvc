'use strict'

const fs = require('fs')
const path = require('path')
const Helpers = use('Helpers')
const log = use('Logger')
const { createLoggerError } = require('./errors')

/**
 * 代码生成器日志类
 * 用于记录代码生成过程中的日志、错误和警告信息
 * 支持将日志写入文件并提供日志摘要功能
 * @class
 */
class GeneratorLogger {
  /**
   * 创建日志记录器实例
   * @constructor
   * @example
   * const logger = new GeneratorLogger()
   */
  constructor() {
    // 存储普通日志记录
    this.logs = []
    // 存储错误日志记录
    this.errors = []
    // 存储警告日志记录
    this.warnings = []
    // 记录开始时间，用于计算总耗时
    this.startTime = Date.now()
    // 获取日志文件路径
    this.logFile = this.getLogFile()
  }

  /**
   * 获取日志文件路径
   * 根据当前日期生成日志文件名，格式为 generator_YYYYMMDD.log
   * @returns {string} 日志文件的绝对路径
   * @example
   * const logFile = logger.getLogFile()
   * // 返回: '/path/to/tmp/logs/generator_20240315.log'
   */
  getLogFile() {
    try {
      // 获取当前日期，用于生成日志文件名
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const logDir = path.join(Helpers.tmpPath('logs'))

      // 确保日志目录存在
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }

      return path.join(logDir, `generator_${year}${month}${day}.log`)
    } catch (err) {
      throw createLoggerError('CREATE_LOG_DIR_FAILED', err)
    }
  }

  /**
   * 记录普通日志
   * 同时将日志写入文件和控制台
   * @param {string} message - 日志消息
   * @example
   * logger.log('开始生成代码')
   * // 写入日志文件: [2024-03-15T10:30:00.000Z] INFO: 开始生成代码
   * // 控制台输出: [info] 开始生成代码
   */
  log(message) {
    try {
      if (!message) {
        throw createLoggerError('EMPTY_LOG_MESSAGE')
      }

      const time = new Date().toISOString()
      const logMessage = `[${time}] INFO: ${message}`

      this.logs.push({
        time,
        type: 'info',
        message,
      })

      fs.appendFileSync(this.logFile, logMessage + '\n')
      log.info(message)
    } catch (err) {
      if (err.code === 'EMPTY_LOG_MESSAGE') {
        throw err
      }
      throw createLoggerError('WRITE_LOG_FAILED', err)
    }
  }

  /**
   * 记录错误日志
   * 同时将错误信息写入文件和控制台，包含错误堆栈
   * @param {Error|string} err - 错误对象或错误消息
   * @param {string} [track] - 错误追踪标识，用于定位错误发生位置
   * @example
   * try {
   *   throw new Error('文件创建失败')
   * } catch (err) {
   *   logger.error(err, 'createFile')
   * }
   * // 写入日志文件: [2024-03-15T10:30:00.000Z] ERROR: 文件创建失败
   * //              Stack: Error: 文件创建失败
   * //                  at ...
   */
  error(err, track) {
    try {
      if (!err) {
        throw createLoggerError('EMPTY_ERROR_MESSAGE')
      }

      const time = new Date().toISOString()
      const error = err instanceof Error ? err : new Error(err)
      const logMessage = `[${time}] ERROR: ${error.message}\nStack: ${error.stack}`

      this.errors.push({
        time,
        type: 'error',
        message: error.message,
        stack: error.stack,
        track,
        code: error.code || 'UNKNOWN_ERROR',
      })

      fs.appendFileSync(this.logFile, logMessage + '\n')
      log.error({ err: error, track }, '代码生成错误')
    } catch (e) {
      if (e.code === 'EMPTY_ERROR_MESSAGE') {
        throw e
      }
      throw createLoggerError('WRITE_ERROR_LOG_FAILED', e)
    }
  }

  /**
   * 记录警告日志
   * 同时将警告信息写入文件和控制台
   * @param {string} message - 警告消息
   * @example
   * logger.warning('字段类型无法识别，使用默认类型 string')
   * // 写入日志文件: [2024-03-15T10:30:00.000Z] WARN: 字段类型无法识别，使用默认类型 string
   * // 控制台输出: [warn] 字段类型无法识别，使用默认类型 string
   */
  warning(message) {
    try {
      if (!message) {
        throw createLoggerError('EMPTY_WARNING_MESSAGE')
      }

      const time = new Date().toISOString()
      const logMessage = `[${time}] WARN: ${message}`

      this.warnings.push({
        time,
        type: 'warning',
        message,
      })

      fs.appendFileSync(this.logFile, logMessage + '\n')
      log.warn(message)
    } catch (err) {
      if (err.code === 'EMPTY_WARNING_MESSAGE') {
        throw err
      }
      throw createLoggerError('WRITE_WARNING_LOG_FAILED', err)
    }
  }

  /**
   * 获取日志摘要信息
   * @returns {Object} 日志摘要
   * @returns {number} summary.totalTime - 总耗时（毫秒）
   * @returns {number} summary.totalLogs - 普通日志数量
   * @returns {number} summary.totalErrors - 错误数量
   * @returns {number} summary.totalWarnings - 警告数量
   * @returns {Array<Object>} summary.errors - 错误日志列表
   * @returns {Array<Object>} summary.warnings - 警告日志列表
   * @returns {string} summary.logFile - 日志文件路径
   * @example
   * const summary = logger.getSummary()
   * console.log(`代码生成完成，耗时 ${summary.totalTime}ms`)
   * console.log(`共有 ${summary.totalErrors} 个错误`)
   */
  getSummary() {
    // 返回日志摘要信息
    return {
      // 计算总耗时（毫秒）
      totalTime: Date.now() - this.startTime,
      // 统计各类日志数量
      totalLogs: this.logs.length,
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      // 返回错误和警告详情，便于排查问题
      errors: this.errors,
      warnings: this.warnings,
      // 返回日志文件路径，便于查看完整日志
      logFile: this.logFile,
    }
  }

  /**
   * 清理旧日志文件
   * 默认保留最近7天的日志文件，删除更早的日志
   * @throws {Error} 当清理过程中发生错误时抛出
   * @example
   * // 清理7天前的日志文件
   * logger.cleanup()
   * // 日志输出: 清理旧日志文件: /path/to/tmp/logs/generator_20240308.log
   */
  cleanup() {
    try {
      const logDir = path.join(Helpers.tmpPath('logs'))
      if (!fs.existsSync(logDir)) {
        throw createLoggerError('LOG_DIR_NOT_FOUND')
      }

      const files = fs.readdirSync(logDir)
      const now = Date.now()
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

      files.forEach((file) => {
        if (file.startsWith('generator_')) {
          const filePath = path.join(logDir, file)
          const stats = fs.statSync(filePath)

          if (stats.mtimeMs < sevenDaysAgo) {
            fs.unlinkSync(filePath)
            this.log(`清理旧日志文件: ${filePath}`)
          }
        }
      })
    } catch (err) {
      if (err.code === 'LOG_DIR_NOT_FOUND') {
        throw err
      }
      throw createLoggerError('CLEANUP_FAILED', err)
    }
  }
}

module.exports = GeneratorLogger
