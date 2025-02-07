'use strict'

/**
 * 错误码定义
 *
 * 错误码格式：GEN-XXX-YYY
 * - GEN: 代码生成器模块前缀
 * - XXX: 错误类型
 *   - SQL: SQL相关错误
 *   - TPL: 模板相关错误
 *   - PATH: 路径相关错误
 *   - FILE: 文件操作错误
 *   - SYS: 系统错误
 * - YYY: 具体错误编号(001-999)
 */
const ERROR_CODES = {
  // SQL相关错误 (SQL-001 ~ SQL-099)
  EMPTY_SQL: 'GEN-SQL-001', // SQL语句为空
  INVALID_SQL: 'GEN-SQL-002', // SQL语句语法错误
  NO_FIELDS: 'GEN-SQL-003', // 未找到任何字段
  NO_TABLES: 'GEN-SQL-004', // 未找到任何表
  UNSUPPORTED_SQL: 'GEN-SQL-005', // 不支持的SQL语句类型（非SELECT）
  FIELD_MISSING_PROPS: 'GEN-SQL-006', // 字段缺少必要属性
  FIELD_INVALID_TYPE: 'GEN-SQL-007', // 字段类型无效

  // 模板相关错误 (TPL-001 ~ TPL-099)
  TEMPLATE_NOT_FOUND: 'GEN-TPL-001', // 模板文件不存在
  TEMPLATE_SYNTAX: 'GEN-TPL-002', // 模板语法错误
  TEMPLATE_RENDER: 'GEN-TPL-003', // 模板渲染错误
  TEMPLATE_VARIABLE: 'GEN-TPL-004', // 模板变量未定义

  // 路径相关错误 (PATH-001 ~ PATH-099)
  INVALID_PATH: 'GEN-PATH-001', // 无效的菜单路径
  PATH_EXISTS: 'GEN-PATH-002', // 菜单路径已存在
  PATH_NOT_FOUND: 'GEN-PATH-003', // 目标路径不存在
  PATH_NO_PERMISSION: 'GEN-PATH-004', // 路径无访问权限

  // 文件操作错误 (FILE-001 ~ FILE-099)
  FILE_NOT_FOUND: 'GEN-FILE-001', // 文件不存在
  FILE_CREATE_FAILED: 'GEN-FILE-002', // 文件创建失败
  FILE_READ_FAILED: 'GEN-FILE-003', // 文件读取失败
  FILE_WRITE_FAILED: 'GEN-FILE-004', // 文件写入失败
  FILE_DELETE_FAILED: 'GEN-FILE-005', // 文件删除失败
  FILE_EXISTS: 'GEN-FILE-006', // 文件已存在
  FILE_NO_PERMISSION: 'GEN-FILE-007', // 文件无操作权限

  // 系统错误 (SYS-001 ~ SYS-099)
  UNKNOWN: 'GEN-SYS-001', // 未知错误
  CONFIG_ERROR: 'GEN-SYS-002', // 配置错误
  DB_ERROR: 'GEN-SYS-003', // 数据库错误
  NETWORK_ERROR: 'GEN-SYS-004', // 网络错误
  TIMEOUT: 'GEN-SYS-005', // 操作超时
  NO_PERMISSION: 'GEN-SYS-006', // 无操作权限

  // 生成器错误 (GEN-001 ~ GEN-099)
  GENERATOR_INIT_ERROR: 'GEN-GEN-001', // 生成器初始化失败
  GENERATOR_PARAMS_ERROR: 'GEN-GEN-002', // 生成器参数错误
  GENERATOR_FRONTEND_ERROR: 'GEN-GEN-003', // 前端代码生成失败
  GENERATOR_BACKEND_ERROR: 'GEN-GEN-004', // 后端代码生成失败
  GENERATOR_CONFIG_ERROR: 'GEN-GEN-005', // 配置文件生成失败
  GENERATOR_FILE_ERROR: 'GEN-GEN-006', // 文件生成失败
  GENERATOR_DATA_ERROR: 'GEN-GEN-007', // 数据准备失败

  // 模板错误 (TPL-001 ~ TPL-099)
  TEMPLATE_LOAD_ERROR: 'GEN-TPL-001', // 模板加载失败
  TEMPLATE_PARSE_ERROR: 'GEN-TPL-002', // 模板解析失败
  TEMPLATE_RENDER_ERROR: 'GEN-TPL-003', // 模板渲染失败
  TEMPLATE_SYNTAX_ERROR: 'GEN-TPL-004', // 模板语法错误
  TEMPLATE_VARIABLE_ERROR: 'GEN-TPL-005', // 模板变量错误
  TEMPLATE_FUNCTION_ERROR: 'GEN-TPL-006', // 模板函数错误

  // 新增错误代码
  TABLE_FIELDS_ERROR: 'TABLE_FIELDS_ERROR', // 获取表字段信息失败
  DIRECTORY_EXISTS: 40010,
}

/**
 * 错误消息定义
 */
const ERROR_MESSAGES = {
  // SQL错误默认消息
  [ERROR_CODES.EMPTY_SQL]: 'SQL语句不能为空',
  [ERROR_CODES.INVALID_SQL]: 'SQL语句格式错误',
  [ERROR_CODES.NO_FIELDS]: '未找到任何字段',
  [ERROR_CODES.NO_TABLES]: '未找到任何表',
  [ERROR_CODES.UNSUPPORTED_SQL]: '不支持的SQL语句类型，仅支持SELECT语句',

  // 模板错误默认消息
  [ERROR_CODES.TEMPLATE_NOT_FOUND]: '模板文件不存在',
  [ERROR_CODES.TEMPLATE_SYNTAX]: '模板语法错误',
  [ERROR_CODES.TEMPLATE_RENDER]: '模板渲染失败',
  [ERROR_CODES.TEMPLATE_VARIABLE]: '模板变量未定义',

  // 路径错误默认消息
  [ERROR_CODES.INVALID_PATH]: '无效的菜单路径',
  [ERROR_CODES.PATH_EXISTS]: '菜单路径已存在',
  [ERROR_CODES.PATH_NOT_FOUND]: '目标路径不存在',
  [ERROR_CODES.PATH_NO_PERMISSION]: '无权访问该路径',

  // 文件错误默认消息
  [ERROR_CODES.FILE_NOT_FOUND]: '文件不存在',
  [ERROR_CODES.FILE_CREATE_FAILED]: '文件创建失败',
  [ERROR_CODES.FILE_READ_FAILED]: '文件读取失败',
  [ERROR_CODES.FILE_WRITE_FAILED]: '文件写入失败',
  [ERROR_CODES.FILE_DELETE_FAILED]: '文件删除失败',
  [ERROR_CODES.FILE_EXISTS]: '文件已存在',
  [ERROR_CODES.FILE_NO_PERMISSION]: '无权操作该文件',

  // 系统错误默认消息
  [ERROR_CODES.UNKNOWN]: '未知错误',
  [ERROR_CODES.CONFIG_ERROR]: '配置错误',
  [ERROR_CODES.DB_ERROR]: '数据库操作失败',
  [ERROR_CODES.NETWORK_ERROR]: '网络连接失败',
  [ERROR_CODES.TIMEOUT]: '操作超时',
  [ERROR_CODES.NO_PERMISSION]: '无操作权限',

  // 生成器错误消息
  [ERROR_CODES.GENERATOR_INIT_ERROR]: '生成器初始化失败',
  [ERROR_CODES.GENERATOR_PARAMS_ERROR]: '生成器参数错误',
  [ERROR_CODES.GENERATOR_FRONTEND_ERROR]: '前端代码生成失败',
  [ERROR_CODES.GENERATOR_BACKEND_ERROR]: '后端代码生成失败',
  [ERROR_CODES.GENERATOR_CONFIG_ERROR]: '配置文件生成失败',
  [ERROR_CODES.GENERATOR_FILE_ERROR]: '文件生成失败',
  [ERROR_CODES.GENERATOR_DATA_ERROR]: '数据准备失败',

  // 模板错误消息
  [ERROR_CODES.TEMPLATE_LOAD_ERROR]: '模板加载失败',
  [ERROR_CODES.TEMPLATE_PARSE_ERROR]: '模板解析失败',
  [ERROR_CODES.TEMPLATE_RENDER_ERROR]: '模板渲染失败',
  [ERROR_CODES.TEMPLATE_SYNTAX_ERROR]: '模板语法错误',
  [ERROR_CODES.TEMPLATE_VARIABLE_ERROR]: '模板变量错误',
  [ERROR_CODES.TEMPLATE_FUNCTION_ERROR]: '模板函数错误',

  // 新增错误消息
  [ERROR_CODES.TABLE_FIELDS_ERROR]: '获取表字段信息失败',
  [ERROR_CODES.DIRECTORY_EXISTS]: '目标目录已存在',
}

/**
 * 生成器错误类
 * 用于统一处理代码生成器中的错误
 */
class GeneratorError extends Error {
  /**
   * 构造函数
   * @param {string} code - 错误代码，格式：GEN-XXX-YYY
   * @param {string} message - 错误消息
   * @param {string} [track] - 错误追踪ID，格式：模块_函数_13位随机数
   */
  constructor(code, message, track = null) {
    // 如果第一个参数是字符串，则认为是消息
    if (typeof code === 'string' && !ERROR_CODES[code] && !message) {
      message = code
      code = ERROR_CODES.UNKNOWN
    }
    // 如果没有提供消息，使用默认消息
    if (!message && ERROR_MESSAGES[code]) {
      message = ERROR_MESSAGES[code]
    }
    super(message || '')
    this.name = 'GeneratorError'
    this.code = code
    this.track = track
  }

  /**
   * 转换为日志格式
   * @returns {Object} 包含错误详细信息的对象
   */
  toLogData() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      track: this.track,
      stack: this.stack,
    }
  }
}

module.exports = {
  ERROR_CODES,
  ERROR_MESSAGES,
  GeneratorError,
}
