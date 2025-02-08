'use strict'

const { Parser } = require('node-sql-parser')
const { ERROR_CODES, GeneratorError } = require('./errors')
const Logger = require('../utils/logger')
const FieldEnhancer = require('./field_enhancer')
const Database = use('Database')

/**
 * SQL解析器类
 */
class SqlParser {
  constructor(options = {}) {
    this.parser = new Parser()
    this.options = {
      database: 'mysql', // 设置数据库类型
    }
    this.logger = options.logger || new Logger({ module: 'SqlParser' })
    this.fieldEnhancer = new FieldEnhancer()
  }

  /**
   * 解析SQL查询语句
   * @param {string} sql - SQL查询语句
   * @returns {Object} 解析结果，包含字段和表信息
   * @throws {GeneratorError} 解析错误时抛出
   */
  async parse(sql) {
    try {
      this.logger.info('开始解析SQL', { sql })

      // 验证SQL不能为空
      if (!sql || !sql.trim()) {
        throw new GeneratorError(ERROR_CODES.EMPTY_SQL, 'SQL语句不能为空', 'parser_parse_empty')
      }

      // 解析SQL为AST
      let ast
      try {
        ast = this.parser.astify(sql, this.options)
        this.logger.debug('SQL解析结果', { ast })
        // 处理ast可能是数组的情况
        if (Array.isArray(ast)) {
          if (ast.length > 1) {
            throw new GeneratorError(ERROR_CODES.INVALID_SQL, '不支持多条SQL语句', 'parser_parse_multiple')
          }
          ast = ast[0]
        }
      } catch (err) {
        // SQL语法错误，直接抛出错误
        this.logger.error('SQL解析失败', { error: err.message })
        throw new GeneratorError(ERROR_CODES.INVALID_SQL, `SQL语句格式错误: ${err.message}`, 'parser_parse_syntax')
      }

      // 检查是否是 SELECT 语句
      if (ast.type !== 'select') {
        throw new GeneratorError(ERROR_CODES.UNSUPPORTED_SQL, '不支持的SQL语句类型，仅支持SELECT语句', 'parser_parse_not_select')
      }

      // 检查是否包含 SELECT *
      for (const column of ast.columns) {
        this.logger.debug('检查字段', { column })
        if (column.expr.type === 'star' || (column.expr.type === 'column_ref' && column.expr.column === '*')) {
          // 如果 * 不是聚合函数的参数，则报错
          if (!column.expr.parent || column.expr.parent.type !== 'aggr_func') {
            throw new GeneratorError(ERROR_CODES.INVALID_SQL, '不允许使用 SELECT *，请明确指定需要的字段', 'parser_parse_star')
          }
        }
      }

      // 提取表信息
      const tables = this._extractTables(ast)
      this.logger.info('提取表信息完成', { tables })

      // 获取表字段信息
      const tableFields = await this._getTableFields(tables)
      this.logger.info('获取表字段信息完成', { tableFields })

      // 提取字段信息
      const fields = await this._extractFields(ast, tableFields)
      this.logger.info('提取字段信息完成', { fields })

      // 检查是否有富文本编辑器
      const has_rich_editor = fields.some((field) => field.form_type === 'rich_editor')
      const rich_editor_fields = has_rich_editor ? fields.filter((field) => field.form_type === 'rich_editor') : []

      return {
        tables,
        fields,
        has_rich_editor,
        rich_editor_fields,
        table_fields: tableFields,
        original_sql: sql,
      }
    } catch (err) {
      // 记录错误并抛出
      this.logger.error(err)
      throw err
    }
  }

  /**
   * 从AST中提取字段信息
   * @private
   * @param {Object} ast - SQL语句的AST
   * @param {Object} tableFields - 表字段信息
   * @returns {Array<Object>} 字段信息列表
   */
  async _extractFields(ast, tableFields) {
    const fields = []

    for (const column of ast.columns) {
      this.logger.debug('处理字段', { column })
      // 设置parent引用
      if (column.expr.type === 'star') {
        this.logger.debug('处理 star 类型字段:', {
          hasParent: !!column.expr.parent,
          parentType: column.expr.parent?.type,
        })
      }

      // 获取字段名和别名
      const originalName = this._getOriginalName(column.expr)
      const defaultAlias = this._getDefaultAlias(column.expr)
      const safeAlias = this._getSafeAlias(column.as || defaultAlias)

      this.logger.debug('字段名称信息:', {
        original: originalName,
        alias: safeAlias,
        column_expr: column.expr,
      })

      const field = {
        original: originalName,
        alias: safeAlias,
        type: this._inferType(column.expr),
      }

      // 设置name属性为alias（因为alias是最终在UI中显示的名称）
      field.name = field.alias

      // 尝试找到原始表字段信息
      let tableField = null
      const originalField = field.original.split('.')[1] // 获取不带表名的字段名
      if (originalField) {
        for (const table of Object.values(tableFields)) {
          if (table[originalField]) {
            tableField = table[originalField]
            break
          }
        }
      }

      // 增强字段信息
      fields.push(this.fieldEnhancer.enhance(field, tableField))
    }

    if (fields.length === 0) {
      throw new GeneratorError(ERROR_CODES.NO_FIELDS, '没有提取到有效的字段信息', 'parser_extract_fields_empty')
    }

    return fields
  }

  /**
   * 从AST中提取表信息
   * @private
   * @param {Object} ast - SQL语句的AST
   * @returns {Array<Object>} 表信息列表
   */
  _extractTables(ast) {
    const tables = []

    // 处理所有表
    for (let i = 0; i < ast.from.length; i++) {
      const table = ast.from[i]
      const tableInfo = {
        name: table.table,
        alias: table.as || table.table,
        type: i === 0 ? 'main' : this._getJoinType(table),
        on: table.on ? this._stringifyExpr(table.on) : null,
      }

      // 处理子查询
      if (table.expr) {
        try {
          tableInfo.name = `(${this._stringifyExpr(table.expr)})`
        } catch (err) {
          this.logger.warn('子查询字符串化失败:', { error: err, expr: table.expr })
        }
      }

      tables.push(tableInfo)
    }

    return tables
  }

  /**
   * 获取表字段信息
   * @private
   * @param {Array<Object>} tables - 表信息列表
   * @returns {Promise<Object>} 表字段信息
   */
  async _getTableFields(tables) {
    const tableFields = {}
    for (const table of tables) {
      try {
        this.logger.debug('获取表字段信息', { table_name: table.name })
        const fields = await Database.raw('SHOW FULL COLUMNS FROM ??', [table.name])
        if (!fields || !fields[0] || !fields[0].length) {
          this.logger.warn('未获取到表字段信息', { table_name: table.name })
          throw new GeneratorError(ERROR_CODES.TABLE_FIELDS_ERROR, `表[${table.name}]不存在或无字段信息`, 'parser_get_table_fields_empty')
        }
        tableFields[table.name] = fields[0].reduce((acc, field) => {
          acc[field.Field] = field
          return acc
        }, {})
        this.logger.debug('表字段信息获取成功', {
          table_name: table.name,
          field_count: fields[0].length,
        })
      } catch (err) {
        this.logger.error('获取表字段信息失败', {
          error: err.message,
          table_name: table.name,
          stack: err.stack,
        })
        if (err instanceof GeneratorError) {
          throw err
        }
        throw new GeneratorError(ERROR_CODES.TABLE_FIELDS_ERROR, `获取表[${table.name}]字段信息失败: ${err.message}`, 'parser_get_table_fields')
      }
    }
    return tableFields
  }

  /**
   * 获取字段的原始名称
   * @private
   * @param {Object} expr - 字段表达式
   * @returns {string} 原始字段名
   * @throws {GeneratorError} 处理表达式时出错
   */
  _getOriginalName(expr) {
    try {
      if (expr.type === 'column_ref') {
        return expr.table ? `${expr.table}.${expr.column}` : expr.column
      }

      // 处理聚合函数
      if (expr.type === 'aggr_func') {
        const args = Array.isArray(expr.args) ? expr.args : [expr.args]
        // 为args.expr添加parent引用
        args.forEach((arg) => {
          if (arg.expr) {
            arg.expr.parent = expr
          }
        })
        return `${expr.name}(${args.map((arg) => this._getOriginalName(arg.expr)).join(', ')})`
      }

      // 处理普通函数
      if (expr.type === 'function') {
        const funcName = expr.name.name[0].value
        const args = expr.args.value
        return `${funcName}(${args.map((arg) => this._getOriginalName(arg)).join(', ')})`
      }

      return this._stringifyExpr(expr)
    } catch (err) {
      this.logger.error('获取字段原始名称失败', { error: err, expr })
      throw new GeneratorError(ERROR_CODES.FIELD_NAME_ERROR, `获取字段原始名称失败: ${err.message}`, 'parser_get_original_name')
    }
  }

  /**
   * 获取字段的默认别名
   * @private
   * @param {Object} expr - 字段表达式
   * @returns {string} 默认别名
   */
  _getDefaultAlias(expr) {
    try {
      if (expr.type === 'column_ref') {
        return expr.column
      }

      if (expr.type === 'aggr_func') {
        const args = Array.isArray(expr.args) ? expr.args : [expr.args]
        const argsStr = args
          .map((arg) => {
            if (arg.expr.type === 'star') {
              return 'all'
            }
            return this._getDefaultAlias(arg.expr)
          })
          .join('_')
        return `${expr.name.toLowerCase()}_${argsStr}`
      }

      if (expr.type === 'function') {
        const funcName = expr.name.name[0].value.toLowerCase()
        const args = expr.args.value
        const argsStr = args.map((arg) => this._getDefaultAlias(arg)).join('_')
        return `${funcName}_${argsStr}`
      }

      if (expr.type === 'binary_expr') {
        const left = this._getDefaultAlias(expr.left)
        const right = this._getDefaultAlias(expr.right)
        return `${left}_${expr.operator}_${right}`
      }

      if (expr.type === 'cast') {
        const value = this._getDefaultAlias(expr.expr)
        const targetType = Array.isArray(expr.target) ? expr.target[0]?.dataType : expr.target.dataType
        return `${value}_as_${targetType.toLowerCase()}`
      }

      if (expr.type === 'case') {
        return 'case_result'
      }

      return 'expr_result'
    } catch (err) {
      this.logger.error('获取默认别名失败:', { error: err, expr })
      return 'expr_result'
    }
  }

  /**
   * 检查是否是MySQL保留字
   * @private
   * @param {string} word - 要检查的词
   * @returns {boolean} 是否是保留字
   */
  _isMySQLReservedWord(word) {
    const reservedWords = [
      'current_time',
      'current_timestamp',
      'current_date',
      'current_user',
      'database',
      'schema',
      'table',
      'column',
      'index',
      'key',
      'primary',
      'foreign',
      'constraint',
      'default',
      'null',
      'not',
      'and',
      'or',
      'like',
      'in',
      'between',
      'is',
      'true',
      'false',
      'all',
      'any',
      'exists',
      'case',
      'when',
      'then',
      'else',
      'end',
      'cast',
      'as',
      'binary',
      'char',
      'date',
      'datetime',
      'decimal',
      'signed',
      'unsigned',
      'time',
      'timestamp',
    ]
    return reservedWords.includes(word.toLowerCase())
  }

  /**
   * 生成安全的字段别名
   * @private
   * @param {string} alias - 原始别名
   * @returns {string} 安全的别名
   */
  _getSafeAlias(alias) {
    if (!alias) {
      return 'field_result'
    }

    // 如果是保留字，加上前缀
    if (this._isMySQLReservedWord(alias)) {
      return `field_${alias}`
    }

    return alias
  }

  /**
   * 推断字段类型
   * @private
   * @param {Object} expr - 字段表达式
   * @returns {string} 字段类型
   */
  _inferType(expr) {
    this.logger.debug('开始推断类型:', { expr_type: expr?.type, expr })

    if (!expr) {
      this.logger.debug('表达式为空，返回默认类型 string')
      return 'string'
    }

    // 检查是否是布尔类型的字段名
    if (expr.type === 'column_ref') {
      const columnName = expr.column.toLowerCase()
      if (columnName.startsWith('is_') || columnName.startsWith('has_') || columnName === 'active' || columnName === 'enabled') {
        this.logger.debug('检测到布尔类型字段名:', { columnName })
        return 'boolean'
      }
    }

    switch (expr.type) {
      case 'number':
        this.logger.debug('数字类型')
        return 'decimal'
      case 'string':
        this.logger.debug('字符串类型')
        return 'string'
      case 'bool':
        this.logger.debug('布尔类型')
        return 'boolean'
      case 'aggr_func':
        const aggrType = this._inferAggrFunctionType(expr)
        this.logger.debug('聚合函数类型:', { aggrType })
        return aggrType
      case 'function':
        const funcType = this._inferFunctionType(expr)
        this.logger.debug('函数类型:', { funcType })
        return funcType
      case 'binary_expr':
        const binaryType = this._inferBinaryExprType(expr)
        this.logger.debug('二元表达式类型:', { binaryType })
        return binaryType
      case 'case':
        const caseType = this._inferCaseType(expr)
        this.logger.debug('CASE表达式类型:', { caseType })
        return caseType
      case 'cast':
        const castType = this._inferCastType(expr)
        this.logger.debug('CAST表达式类型:', { castType })
        return castType
      default:
        this.logger.debug('未知类型，返回默认类型 string:', { type: expr.type })
        return 'string'
    }
  }

  /**
   * 推断二元表达式的返回类型
   * @private
   * @param {Object} expr - 二元表达式
   * @returns {string} 返回值类型
   */
  _inferBinaryExprType(expr) {
    // 比较运算符返回布尔值
    const compareOps = ['=', '!=', '<>', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'LIKE', 'NOT LIKE']
    if (compareOps.includes(expr.operator.toUpperCase())) {
      return 'boolean'
    }

    // 逻辑运算符返回布尔值
    const logicOps = ['AND', 'OR', 'NOT']
    if (logicOps.includes(expr.operator.toUpperCase())) {
      return 'boolean'
    }

    // 算术运算符返回数值
    const mathOps = ['+', '-', '*', '/', '%']
    if (mathOps.includes(expr.operator)) {
      return 'decimal'
    }

    // 默认返回字符串
    return 'string'
  }

  /**
   * 推断聚合函数返回值类型
   * @private
   * @param {Object} expr - 聚合函数表达式
   * @returns {string} 函数返回值类型
   */
  _inferAggrFunctionType(expr) {
    try {
      const funcName = expr.name.toLowerCase()
      this.logger.debug('推断聚合函数类型:', { funcName, expr })

      switch (funcName) {
        case 'count':
          return 'integer'
        case 'sum':
        case 'avg':
        case 'min':
        case 'max':
          return 'decimal'
        default:
          this.logger.debug('未知的聚合函数，返回string:', { funcName })
          return 'string'
      }
    } catch (err) {
      this.logger.error('推断聚合函数类型时出错:', err)
      return 'string'
    }
  }

  /**
   * 推断普通函数返回值类型
   * @private
   * @param {Object} expr - 函数表达式
   * @returns {string} 函数返回值类型
   */
  _inferFunctionType(expr) {
    const funcName = expr.name.name[0].value.toLowerCase()

    // 日期时间函数
    if (['date_format', 'date', 'time', 'timestamp'].includes(funcName)) {
      return 'datetime'
    }

    // 布尔函数
    if (['if', 'ifnull', 'case'].includes(funcName)) {
      return 'boolean'
    }

    // 数值函数
    if (['abs', 'round', 'ceil', 'floor'].includes(funcName)) {
      return 'decimal'
    }

    // 字符串函数
    if (['concat', 'substring', 'trim', 'upper', 'lower'].includes(funcName)) {
      return 'string'
    }

    return 'string'
  }

  /**
   * 推断CASE表达式返回值类型
   * @private
   * @param {Object} expr - CASE表达式
   * @returns {string} 返回值类型
   */
  _inferCaseType(expr) {
    // 检查第一个THEN的结果类型
    for (const arg of expr.args) {
      if (arg.type === 'when') {
        return this._inferType(arg.result)
      }
    }
    return 'string'
  }

  /**
   * 推断CAST表达式返回值类型
   * @private
   * @param {Object} expr - CAST表达式
   * @returns {string} 返回值类型
   */
  _inferCastType(expr) {
    try {
      if (!expr.target) {
        this.logger.warn('CAST表达式缺少目标类型，使用默认类型 string', { expr })
        return 'string'
      }

      // 获取目标类型（可能是数组形式）
      const targetType = Array.isArray(expr.target) ? expr.target[0]?.dataType?.toLowerCase() : expr.target.dataType?.toLowerCase()

      if (!targetType) {
        this.logger.warn('CAST表达式目标类型无效，使用默认类型 string', { expr, targetType })
        return 'string'
      }

      this.logger.debug('CAST目标类型:', { targetType, expr })

      switch (targetType) {
        case 'signed':
        case 'int':
        case 'integer':
          return 'integer'
        case 'decimal':
        case 'float':
        case 'double':
        case 'number':
        case 'numeric':
          return 'decimal'
        case 'datetime':
        case 'timestamp':
        case 'date':
        case 'time':
          return 'datetime'
        case 'bool':
        case 'boolean':
        case 'tinyint':
          return 'boolean'
        case 'char':
        case 'varchar':
        case 'text':
        default:
          this.logger.debug('未知的CAST目标类型，返回string:', { targetType })
          return 'string'
      }
    } catch (err) {
      this.logger.error('推断CAST类型时出错:', { error: err, expr })
      return 'string'
    }
  }

  /**
   * 将表达式转换为字符串
   * @private
   * @param {Object} expr - 表达式对象
   * @returns {string} 字符串形式的表达式
   * @throws {GeneratorError} 处理表达式时出错
   */
  _stringifyExpr(expr) {
    try {
      if (!expr) {
        this.logger.debug('表达式为空，返回空字符串')
        return ''
      }

      if (expr.type === 'bool') {
        return expr.value ? 'true' : 'false'
      }

      if (expr.type === 'binary_expr') {
        const left = this._stringifyExpr(expr.left)
        const right = this._stringifyExpr(expr.right)
        // 如果是乘除运算，且左边是加减运算，需要加括号
        const needParens =
          (expr.operator === '*' || expr.operator === '/') && expr.left.type === 'binary_expr' && (expr.left.operator === '+' || expr.left.operator === '-')
        return needParens ? `(${left}) ${expr.operator} ${right}` : `${left} ${expr.operator} ${right}`
      }

      if (expr.type === 'column_ref') {
        return expr.table ? `${expr.table}.${expr.column}` : expr.column
      }

      if (expr.type === 'string' || expr.type === 'single_quote_string') {
        return `'${expr.value}'`
      }

      if (expr.type === 'number') {
        return expr.value.toString()
      }

      if (expr.type === 'null') {
        return 'NULL'
      }

      if (expr.type === 'aggr_func') {
        const args = Array.isArray(expr.args) ? expr.args : [expr.args]
        const argsStr = args
          .map((arg) => {
            if (arg.expr.type === 'star') {
              return '*'
            }
            return this._stringifyExpr(arg.expr)
          })
          .join(', ')
        return `${expr.name}(${argsStr})`
      }

      if (expr.type === 'function') {
        const funcName = expr.name.name[0].value
        const args = expr.args.value
        this.logger.debug('处理函数表达式:', { funcName, args })
        return `${funcName}(${args.map((arg) => this._stringifyExpr(arg)).join(', ')})`
      }

      if (expr.type === 'case') {
        let result = 'CASE'
        for (const arg of expr.args) {
          if (arg.type === 'when') {
            result += ` WHEN ${this._stringifyExpr(arg.cond)} THEN ${this._stringifyExpr(arg.result)}`
          } else if (arg.type === 'else') {
            result += ` ELSE ${this._stringifyExpr(arg.result)}`
          }
        }
        result += ' END'
        return result
      }

      if (expr.type === 'cast') {
        const target = Array.isArray(expr.target) ? expr.target[0] : expr.target
        return `CAST(${this._stringifyExpr(expr.expr)} AS ${target.dataType})`
      }

      if (expr.type === 'star') {
        return '*'
      }

      this.logger.warn('未知的表达式类型:', { type: expr.type, expr })
      return expr.toString()
    } catch (err) {
      this.logger.error('表达式字符串化失败:', { error: err, expr })
      throw new GeneratorError(ERROR_CODES.EXPR_STRINGIFY_ERROR, `表达式字符串化失败: ${err.message}`, 'parser_stringify_expr')
    }
  }

  /**
   * 获取JOIN类型
   * @private
   * @param {Object} table - 表信息
   * @returns {string} JOIN类型
   */
  _getJoinType(table) {
    if (!table.join) {
      return 'cross'
    }

    const joinType = table.join.type?.toUpperCase()
    this.logger.debug('获取JOIN类型:', { joinType, table })

    // 处理子查询
    if (table.expr) {
      this.logger.debug('检测到子查询:', { expr: table.expr })
      return table.join.type?.toUpperCase() || 'cross'
    }

    switch (joinType) {
      case 'LEFT':
      case 'LEFT OUTER':
        return 'left'
      case 'RIGHT':
      case 'RIGHT OUTER':
        return 'right'
      case 'INNER':
      case 'JOIN':
        return 'inner'
      case 'CROSS':
        return 'cross'
      case 'NATURAL':
        return 'inner'
      default:
        this.logger.debug('未知的JOIN类型，使用cross:', { joinType })
        return 'cross'
    }
  }
}

module.exports = SqlParser
