'use strict'

/**
 * 错误码定义
 * 格式：GEN + 模块代码 + 错误类型 + 序号
 * 模块代码：
 * - PAR: Parser 解析器
 * - GEN: Generator 生成器
 * - LOG: Logger 日志
 * 错误类型：
 * - SYN: 语法错误
 * - VAL: 验证错误
 * - IO: 文件操作错误
 * - DB: 数据库错误
 * - SYS: 系统错误
 */

class GeneratorError extends Error {
  /**
   * 创建生成器错误
   * @param {string} code - 错误码
   * @param {string} message - 错误消息
   * @param {Error} [cause] - 原始错误
   */
  constructor(code, message, cause) {
    super(message)
    this.code = code
    this.cause = cause
    this.name = 'GeneratorError'
    this.time = new Date().toISOString()
  }

  /**
   * 获取错误的完整信息
   * @returns {Object} 错误信息对象
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      name: this.name,
      time: this.time,
      stack: this.stack,
      cause: this.cause?.message,
    }
  }
}

// Parser 错误码
const PARSER_ERRORS = {
  // 语法错误
  INVALID_SQL: {
    code: 'GEN-PAR-SYN-001',
    message: '无效的 SQL 查询语句',
  },
  MISSING_FROM: {
    code: 'GEN-PAR-SYN-002',
    message: '缺少 FROM 子句',
  },
  INVALID_FIELD: {
    code: 'GEN-PAR-SYN-003',
    message: '无效的字段定义',
  },
  INVALID_TABLE: {
    code: 'GEN-PAR-SYN-004',
    message: '无效的表定义',
  },

  // 验证错误
  EMPTY_SQL: {
    code: 'GEN-PAR-VAL-001',
    message: 'SQL 查询语句不能为空',
  },
  NO_FIELDS: {
    code: 'GEN-PAR-VAL-002',
    message: '未找到任何字段定义',
  },
  NO_TABLES: {
    code: 'GEN-PAR-VAL-003',
    message: '未找到任何表定义',
  },
}

// Generator 错误码
const GENERATOR_ERRORS = {
  // 验证错误
  INVALID_PATH: {
    code: 'GEN-GEN-VAL-001',
    message: '无效的菜单路径',
  },
  MISSING_FIELDS: {
    code: 'GEN-GEN-VAL-002',
    message: '缺少字段定义',
  },
  MISSING_TABLES: {
    code: 'GEN-GEN-VAL-003',
    message: '缺少表定义',
  },

  // 文件操作错误
  CREATE_DIR_FAILED: {
    code: 'GEN-GEN-IO-001',
    message: '创建目录失败',
  },
  READ_TEMPLATE_FAILED: {
    code: 'GEN-GEN-IO-002',
    message: '读取模板文件失败',
  },
  WRITE_FILE_FAILED: {
    code: 'GEN-GEN-IO-003',
    message: '写入文件失败',
  },

  // 系统错误
  INIT_FAILED: {
    code: 'GEN-GEN-SYS-001',
    message: '初始化生成器失败',
  },
  GENERATE_FAILED: {
    code: 'GEN-GEN-SYS-002',
    message: '生成代码失败',
  },
}

// Logger 错误码
const LOGGER_ERRORS = {
  // 文件操作错误
  CREATE_LOG_DIR_FAILED: {
    code: 'GEN-LOG-IO-001',
    message: '创建日志目录失败',
  },
  WRITE_LOG_FAILED: {
    code: 'GEN-LOG-IO-002',
    message: '写入日志失败',
  },
  READ_LOG_FAILED: {
    code: 'GEN-LOG-IO-003',
    message: '读取日志失败',
  },

  // 系统错误
  CLEANUP_FAILED: {
    code: 'GEN-LOG-SYS-001',
    message: '清理日志文件失败',
  },
}

/**
 * 创建解析器错误
 * @param {string} type - 错误类型
 * @param {string} [detail] - 错误详情
 * @param {Error} [cause] - 原始错误
 * @returns {GeneratorError} 生成器错误
 */
function createParserError(type, detail, cause) {
  const error = PARSER_ERRORS[type]
  if (!error) {
    throw new Error(`未知的解析器错误类型: ${type}`)
  }
  const message = detail ? `${error.message}: ${detail}` : error.message
  return new GeneratorError(error.code, message, cause)
}

/**
 * 创建生成器错误
 * @param {string} type - 错误类型
 * @param {string} [detail] - 错误详情
 * @param {Error} [cause] - 原始错误
 * @returns {GeneratorError} 生成器错误
 */
function createGeneratorError(type, detail, cause) {
  const error = GENERATOR_ERRORS[type]
  if (!error) {
    throw new Error(`未知的生成器错误类型: ${type}`)
  }
  const message = detail ? `${error.message}: ${detail}` : error.message
  return new GeneratorError(error.code, message, cause)
}

/**
 * 创建日志错误
 * @param {string} type - 错误类型
 * @param {string} [detail] - 错误详情
 * @param {Error} [cause] - 原始错误
 * @returns {GeneratorError} 生成器错误
 */
function createLoggerError(type, detail, cause) {
  const error = LOGGER_ERRORS[type]
  if (!error) {
    throw new Error(`未知的日志错误类型: ${type}`)
  }
  const message = detail ? `${error.message}: ${detail}` : error.message
  return new GeneratorError(error.code, message, cause)
}

module.exports = {
  GeneratorError,
  createParserError,
  createGeneratorError,
  createLoggerError,
  PARSER_ERRORS,
  GENERATOR_ERRORS,
  LOGGER_ERRORS,
}
