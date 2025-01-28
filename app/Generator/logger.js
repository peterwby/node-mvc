'use strict'

const fs = require('fs')
const path = require('path')
const Helpers = use('Helpers')
const log = use('Logger')

/**
 * 代码生成器日志类
 */
class GeneratorLogger {
  constructor() {
    this.logs = []
    this.errors = []
    this.warnings = []
    this.startTime = Date.now()
    this.logFile = this.getLogFile()
  }

  /**
   * 获取日志文件路径
   */
  getLogFile() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const logDir = path.join(Helpers.tmpPath('logs'))

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    return path.join(logDir, `generator_${year}${month}${day}.log`)
  }

  /**
   * 记录普通日志
   */
  log(message) {
    const time = new Date().toISOString()
    const logMessage = `[${time}] INFO: ${message}`

    this.logs.push({
      time,
      type: 'info',
      message,
    })

    fs.appendFileSync(this.logFile, logMessage + '\n')
    log.info(message)
  }

  /**
   * 记录错误日志
   */
  error(err, track) {
    const time = new Date().toISOString()
    const error = err instanceof Error ? err : new Error(err)
    const logMessage = `[${time}] ERROR: ${error.message}\nStack: ${error.stack}`

    this.errors.push({
      time,
      type: 'error',
      message: error.message,
      stack: error.stack,
      track,
    })

    fs.appendFileSync(this.logFile, logMessage + '\n')
    log.error({ err: error, track }, '代码生成错误')
  }

  /**
   * 记录警告日志
   */
  warning(message) {
    const time = new Date().toISOString()
    const logMessage = `[${time}] WARN: ${message}`

    this.warnings.push({
      time,
      type: 'warning',
      message,
    })

    fs.appendFileSync(this.logFile, logMessage + '\n')
    log.warn(message)
  }

  /**
   * 获取日志摘要
   */
  getSummary() {
    return {
      totalTime: Date.now() - this.startTime,
      totalLogs: this.logs.length,
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings,
      logFile: this.logFile,
    }
  }

  /**
   * 清理旧日志文件（保留最近7天）
   */
  cleanup() {
    try {
      const logDir = path.join(Helpers.tmpPath('logs'))
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
      this.error(err, 'cleanup')
    }
  }
}

module.exports = GeneratorLogger
