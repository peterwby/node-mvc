'use strict'

const Database = use('Database')
const log = use('Logger')
const { createParserError } = require('./errors')

/**
 * 从 SQL 查询语句中提取字段定义
 * @param {string} sql_query - SQL 查询语句，支持单表或多表联合查询
 * @returns {Array<{
 *   original: string, // 原始字段定义，如 "t1.user_name"
 *   alias: string,    // 字段别名，如 "user_name"
 *   type: string      // 字段类型，如 "string", "number", "datetime", "boolean"
 * }>} 字段定义列表
 * @example
 * // 单表查询
 * extractFieldDefinitions('SELECT id, name, created_at FROM users')
 * // 返回: [{original: 'id', alias: 'id', type: 'number'}, ...]
 *
 * // 带别名的查询
 * extractFieldDefinitions('SELECT u.id AS user_id, u.name AS user_name FROM users u')
 * // 返回: [{original: 'u.id', alias: 'user_id', type: 'number'}, ...]
 */
function extractFieldDefinitions(sql_query) {
  try {
    // 检查 SQL 是否为空
    if (!sql_query?.trim()) {
      throw createParserError('EMPTY_SQL')
    }

    // 将多行 SQL 转换为单行，去除多余空格，便于后续处理
    const sql = sql_query.replace(/\s+/g, ' ').trim()

    // 提取 SELECT 和 FROM 之间的部分，即字段定义部分
    const selectMatch = sql.match(/select\s+(.+?)\s+from\s+/i)
    if (!selectMatch) {
      throw createParserError('INVALID_SQL', 'SELECT 语句格式错误')
    }

    const fieldsPart = selectMatch[1]
    const fields = []

    // 使用状态机解析字段定义，处理括号、引号等特殊情况
    let current = '' // 当前正在处理的字段定义
    let inQuote = false // 是否在引号内
    let inBracket = 0 // 括号嵌套层数
    let separator = false // 是否遇到字段分隔符

    // 逐字符解析，处理以下特殊情况：
    // 1. 引号内的逗号不作为分隔符
    // 2. 括号内的逗号不作为分隔符
    // 3. 支持嵌套括号
    for (let i = 0; i < fieldsPart.length; i++) {
      const char = fieldsPart[i]

      // 处理引号（单引号或双引号）
      if (char === '"' || char === "'") {
        inQuote = !inQuote
      }
      // 处理左括号，增加嵌套层数
      else if (char === '(') {
        inBracket++
      }
      // 处理右括号，减少嵌套层数
      else if (char === ')') {
        inBracket--
      }
      // 处理逗号，但只在不在引号内且不在括号内时才作为分隔符
      else if (char === ',' && !inQuote && inBracket === 0) {
        separator = true
      }

      // 遇到分隔符时，解析当前累积的字段定义
      if (separator) {
        if (current.trim()) {
          try {
            fields.push(parseFieldDefinition(current.trim()))
          } catch (err) {
            throw createParserError('INVALID_FIELD', current.trim(), err)
          }
        }
        current = ''
        separator = false
      } else {
        current += char
      }
    }

    // 处理最后一个字段（不以逗号结尾）
    if (current.trim()) {
      try {
        fields.push(parseFieldDefinition(current.trim()))
      } catch (err) {
        throw createParserError('INVALID_FIELD', current.trim(), err)
      }
    }

    // 检查是否找到任何字段
    if (fields.length === 0) {
      throw createParserError('NO_FIELDS')
    }

    return fields
  } catch (err) {
    // 如果已经是 GeneratorError，直接抛出
    if (err.name === 'GeneratorError') {
      throw err
    }
    // 否则包装为 INVALID_SQL 错误
    throw createParserError('INVALID_SQL', err.message, err)
  }
}

/**
 * 解析单个字段定义，支持多种别名格式和特殊字段处理
 * @param {string} fieldDef - 字段定义，可以是以下格式：
 *                           1. "field AS alias"
 *                           2. "field alias"
 *                           3. "table.field"
 *                           4. "field"
 *                           5. "FUNCTION(field) AS alias"
 * @returns {{
 *   original: string, // 原始字段定义
 *   alias: string,    // 解析后的别名
 *   type: string      // 推断的字段类型
 * }} 解析结果
 * @example
 * parseFieldDefinition('user_name AS name')
 * // 返回: {original: 'user_name', alias: 'name', type: 'string'}
 *
 * parseFieldDefinition('COUNT(*) AS total')
 * // 返回: {original: 'COUNT(*)', alias: 'total', type: 'number'}
 */
function parseFieldDefinition(fieldDef) {
  try {
    // 去除首尾空格
    fieldDef = fieldDef.trim()

    // 1. 处理 AS 别名（大小写不敏感）
    // 例如：user_name AS name, COUNT(*) AS total
    const asMatch = fieldDef.match(/^(.+?)\s+as\s+(\w+)$/i)
    if (asMatch) {
      return {
        original: asMatch[1].trim(),
        alias: asMatch[2].trim(),
        type: getFieldType(asMatch[1].trim()),
      }
    }

    // 2. 处理空格别名，但要排除一些特殊情况：
    // - CASE WHEN ... END 语句
    // - 函数调用中的空格
    // 例如：user_name name（有效）, CASE WHEN ... END status（无效）
    const spaceMatch = fieldDef.match(/^(.+?)\s+(\w+)$/)
    if (spaceMatch) {
      const beforeSpace = spaceMatch[1].trim()
      // 如果前半部分包含这些关键字，说明不是别名
      if (
        !beforeSpace.match(/\b(case|when|then|else|end|from|null|true|false|and|or|in)\b/i) &&
        // 如果前半部分以)结尾，说明可能是函数调用，此时后面的是别名
        (beforeSpace.endsWith(')') ||
          // 或者前半部分是简单字段（可能带表名前缀）
          beforeSpace.match(/^(\w+\.)*\w+$/))
      ) {
        return {
          original: beforeSpace,
          alias: spaceMatch[2].trim(),
          type: getFieldType(beforeSpace),
        }
      }
    }

    // 3. 无别名，使用字段本身作为别名
    // 如果是 table.field 格式，只使用 field 作为别名
    // 例如：users.id -> id, name -> name
    const dotMatch = fieldDef.match(/^(?:\w+\.)?(\w+)$/)
    if (dotMatch) {
      return {
        original: fieldDef,
        alias: dotMatch[1],
        type: getFieldType(fieldDef),
      }
    }

    // 4. 其他情况（函数、表达式等），需要生成一个别名
    // 例如：CONCAT(first_name, ' ', last_name) -> first_name_last_name
    return {
      original: fieldDef,
      alias: fieldDef
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_') // 非法字符转为下划线
        .replace(/_+/g, '_') // 多个下划线合并
        .replace(/^_+|_+$/g, ''), // 去除首尾下划线
      type: getFieldType(fieldDef),
    }
  } catch (err) {
    throw createParserError('INVALID_FIELD', fieldDef, err)
  }
}

/**
 * 根据字段定义推断字段类型
 * @param {string} fieldDef - 字段定义，可以是字段名、函数调用或表达式
 * @returns {string} 推断的字段类型，可能的值：
 *                   - 'number': 数值类型（整数、小数）
 *                   - 'datetime': 日期时间类型
 *                   - 'boolean': 布尔类型
 *                   - 'string': 字符串类型（默认）
 * @example
 * getFieldType('COUNT(*)')     // 返回: 'number'
 * getFieldType('created_at')   // 返回: 'datetime'
 * getFieldType('is_active')    // 返回: 'boolean'
 * getFieldType('name')         // 返回: 'string'
 */
function getFieldType(fieldDef) {
  // 转换为小写便于匹配
  const def = fieldDef.toLowerCase()

  // 1. 数值类型函数和字段
  // - 聚合函数：COUNT, SUM, AVG, MIN, MAX
  // - 数值类型：DECIMAL, NUMERIC, INT, FLOAT, DOUBLE
  if (def.match(/^(count|sum|avg|min|max)\s*\(/i) || def.match(/\b(decimal|numeric|int|float|double)\b/i)) {
    return 'number'
  }

  // 2. 日期时间类型
  // - 日期函数：NOW, CURDATE, DATE_FORMAT
  // - 日期类型：DATETIME, TIMESTAMP
  if (def.match(/^(now|curdate|date_format|date|time|timestamp)\s*\(/i) || def.match(/\b(datetime|timestamp)\b/i)) {
    return 'datetime'
  }

  // 3. 布尔类型
  // - 布尔值：TRUE, FALSE
  // - 条件表达式：IF, IFNULL, CASE
  if (def.match(/\b(bool|boolean|true|false)\b/i) || def.match(/\b(if|ifnull|case)\b/i)) {
    return 'boolean'
  }

  // 4. 默认为字符串类型
  // 包括：VARCHAR, TEXT, CHAR 等
  return 'string'
}

/**
 * 从 SQL 查询语句中提取所有表名及其别名
 * @param {string} sql_query - SQL 查询语句，支持 JOIN 语句
 * @returns {Array<{
 *   name: string,  // 表名
 *   alias: string  // 表别名（如果没有别名，则与表名相同）
 * }>} 表名和别名列表
 * @throws {Error} 当 SQL 语句无效或缺少 FROM 子句时抛出错误
 * @example
 * // 简单查询
 * extractTableNames('SELECT * FROM users')
 * // 返回: [{name: 'users', alias: 'users'}]
 *
 * // 带 JOIN 的查询
 * extractTableNames('SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id')
 * // 返回: [{name: 'users', alias: 'u'}, {name: 'orders', alias: 'o'}]
 */
function extractTableNames(sql_query) {
  try {
    // 检查 SQL 是否为空
    if (!sql_query?.trim()) {
      throw createParserError('EMPTY_SQL')
    }

    // 将多行 SQL 转换为单行，去除多余空格，转为小写便于处理
    const sql = sql_query.replace(/\s+/g, ' ').trim().toLowerCase()
    const tables = []

    // 1. 提取 FROM 子句
    // 查找 FROM 和下一个主要子句（WHERE, GROUP BY, HAVING, ORDER BY, LIMIT）之间的部分
    const fromPart = sql.match(/\bfrom\b(.*?)(?:\bwhere\b|\bgroup by\b|\bhaving\b|\border by\b|\blimit\b|$)/i)
    if (!fromPart) {
      throw createParserError('MISSING_FROM')
    }

    // 2. 分割 JOIN 子句
    // 支持的 JOIN 类型：LEFT JOIN, RIGHT JOIN, INNER JOIN, CROSS JOIN
    const fromClause = fromPart[1].trim()
    const joinParts = fromClause.split(/\b(left|right|inner|cross)?\s*join\b/i)

    // 3. 处理主表（第一个表）
    const mainTable = extractTableAndAlias(joinParts[0])
    if (mainTable) {
      tables.push(mainTable)
    }

    // 4. 处理 JOIN 的表
    // joinParts 数组的奇数索引是 JOIN 类型，偶数索引是表定义
    for (let i = 1; i < joinParts.length; i += 2) {
      // joinParts[i] 是 join 类型（可能为空，表示普通 JOIN）
      // joinParts[i + 1] 是表定义（如果存在）
      if (joinParts[i + 1]) {
        // 去除 ON 条件部分，只保留表名和别名
        const tablePart = joinParts[i + 1].split(/\bon\b/i)[0].trim()
        const joinedTable = extractTableAndAlias(tablePart)
        if (joinedTable) {
          tables.push(joinedTable)
        }
      }
    }

    // 检查是否找到任何表
    if (tables.length === 0) {
      throw createParserError('NO_TABLES')
    }

    return tables
  } catch (err) {
    // 如果已经是 GeneratorError，直接抛出
    if (err.name === 'GeneratorError') {
      throw err
    }
    // 否则包装为 INVALID_SQL 错误
    throw createParserError('INVALID_SQL', err.message, err)
  }
}

/**
 * 从表定义中提取表名和别名
 * @param {string} tableDef - 表定义字符串，支持以下格式：
 *                           1. "table_name AS alias"
 *                           2. "table_name alias"
 *                           3. "table_name"
 * @returns {{
 *   name: string,  // 表名
 *   alias: string  // 表别名（如果没有别名，则与表名相同）
 * } | null} 解析结果，如果解析失败返回 null
 * @example
 * extractTableAndAlias('users AS u')
 * // 返回: {name: 'users', alias: 'u'}
 *
 * extractTableAndAlias('users')
 * // 返回: {name: 'users', alias: 'users'}
 */
function extractTableAndAlias(tableDef) {
  try {
    if (!tableDef) return null

    // 去除首尾空格
    tableDef = tableDef.trim()

    // 1. 处理 AS 别名（大小写不敏感）
    // 例如：users AS u
    const asMatch = tableDef.match(/^(\w+)\s+as\s+(\w+)/i)
    if (asMatch) {
      return {
        name: asMatch[1],
        alias: asMatch[2],
      }
    }

    // 2. 处理空格别名
    // 例如：users u
    const spaceMatch = tableDef.match(/^(\w+)\s+(\w+)$/)
    if (spaceMatch) {
      return {
        name: spaceMatch[1],
        alias: spaceMatch[2],
      }
    }

    // 3. 无别名
    // 例如：users
    const nameMatch = tableDef.match(/^(\w+)$/)
    if (nameMatch) {
      return {
        name: nameMatch[1],
        alias: nameMatch[1], // 使用表名作为别名
      }
    }

    throw createParserError('INVALID_TABLE', tableDef)
  } catch (err) {
    if (err.name === 'GeneratorError') {
      throw err
    }
    throw createParserError('INVALID_TABLE', tableDef, err)
  }
}

/**
 * 检查 SQL 查询语句是否已包含 LIMIT 子句
 * @param {string} sql_query - SQL 查询语句
 * @returns {boolean} 如果包含 LIMIT 子句返回 true，否则返回 false
 * @example
 * hasLimit('SELECT * FROM users LIMIT 10')  // 返回: true
 * hasLimit('SELECT * FROM users')           // 返回: false
 */
function hasLimit(sql_query) {
  return /\blimit\s+\d+/i.test(sql_query)
}

/**
 * 从字段名推断 HTML input 类型
 * @param {string} field_name 字段名
 * @param {string} base_type 基本类型
 * @returns {string} HTML input 类型
 */
function inferHtmlType(field_name, base_type) {
  const name = field_name.toLowerCase()

  if (name.includes('email')) return 'email'
  if (name.includes('phone') || name.includes('mobile') || name.includes('tel')) return 'tel'
  if (base_type === 'number') return 'number'
  if (base_type === 'datetime') return 'date'
  if (name.includes('password')) return 'password'

  return 'text'
}

/**
 * 从字段定义推断表单控件类型
 * @param {string} field_name 字段名
 * @param {Object} field_info 字段信息
 * @returns {string} 表单控件类型
 */
function inferFieldType(field_name, field_info) {
  const name = field_name.toLowerCase()
  const type = (field_info.Type || '').toLowerCase()

  // 密码字段
  if (name.includes('password')) return 'password'

  // 状态字段或外键字段（以 _id 结尾）
  if (name.includes('status') || name.endsWith('_id')) return 'select'

  // 富文本编辑器
  if (type.includes('text') || type.includes('longtext')) return 'rich_editor'

  // 文本域
  if (type.includes('varchar') && parseInt(type.match(/\d+/)[0] || 0) > 255) return 'textarea'

  return 'text'
}

/**
 * 增强字段信息
 * @param {Object} field 基本字段信息
 * @param {Object} table_field 数据库表字段信息
 * @returns {Object} 增强后的字段信息
 */
function enhanceFieldInfo(field, table_field) {
  const enhanced = {
    ...field,
    required: table_field ? table_field.nullable === 'NO' : false,
    html_type: inferHtmlType(field.name, field.type),
    type: table_field ? inferFieldType(field.name, table_field) : 'text',
    validation: {},
  }

  // 添加验证规则
  if (enhanced.required) {
    enhanced.validation.notEmpty = {
      message: 'please enter in the correct format',
    }
  }

  if (enhanced.html_type === 'email') {
    enhanced.validation.emailAddress = {
      message: 'please enter in the correct format',
    }
  }

  if (enhanced.type === 'password') {
    enhanced.validation.stringLength = {
      min: 6,
      max: 16,
      message: 'please enter in the correct format',
    }
  }

  return enhanced
}

/**
 * 从 SQL 查询语句中提取字段信息
 * @param {string} sql_query SQL 查询语句
 * @returns {Promise<{fields: Array, tables: Array}>} 字段列表和涉及的表名列表
 */
async function extractFields(sql_query) {
  try {
    // 1. 提取涉及的表名
    const tables = extractTableNames(sql_query)

    // 2. 提取字段定义
    const fieldDefs = extractFieldDefinitions(sql_query)

    // 3. 获取所有表的字段信息
    const tableFields = {}
    for (const table of tables) {
      const fields = await getTableFields(table.name)
      tableFields[table.name] = fields.reduce((acc, field) => {
        acc[field.Field] = field
        return acc
      }, {})
    }

    // 4. 执行 SQL 查询，获取一条数据的结构
    const finalSql = hasLimit(sql_query) ? sql_query : sql_query + ' LIMIT 1'
    const result = await Database.raw(finalSql)
    if (!result || !result[0] || !result[0][0]) {
      throw new Error('SQL 查询没有返回数据，请检查查询语句')
    }

    // 5. 从结果中提取字段信息
    const row = result[0][0]
    const fields = []
    for (const key in row) {
      // 查找对应的字段定义
      const fieldDef = fieldDefs.find((def) => def.alias === key)
      if (fieldDef) {
        // 尝试找到原始表字段信息
        let tableField = null
        const originalField = fieldDef.original.split('.')[1] // 获取不带表名的字段名
        if (originalField) {
          for (const table of tables) {
            if (tableFields[table.name][originalField]) {
              tableField = tableFields[table.name][originalField]
              break
            }
          }
        }

        // 基本字段信息
        const field = {
          name: key,
          label: key, // 用字段名作为翻译key
          original: fieldDef.original,
          type: fieldDef.type || typeof row[key],
        }

        // 增强字段信息
        fields.push(enhanceFieldInfo(field, tableField))
      }
    }

    // 6. 检查是否有富文本编辑器
    const has_rich_editor = fields.some((field) => field.type === 'rich_editor')
    const rich_editor_fields = has_rich_editor ? fields.filter((field) => field.type === 'rich_editor') : []

    return {
      fields,
      tables,
      has_rich_editor,
      rich_editor_fields,
      table_fields: tableFields,
    }
  } catch (err) {
    log.error('SQL解析错误:', err)
    throw new Error('SQL 解析失败: ' + err.message)
  }
}

/**
 * 验证表是否存在
 * @param {string} table_name 表名
 * @returns {Promise<boolean>} 表是否存在
 */
async function validateTable(table_name) {
  try {
    const result = await Database.raw('SHOW TABLES LIKE ?', [table_name])
    return result[0].length > 0
  } catch (err) {
    log.error('表验证错误:', err)
    throw new Error('表验证失败: ' + err.message)
  }
}

/**
 * 获取表的所有字段信息
 * @param {string} table_name 表名
 * @returns {Promise<Array>} 字段列表，每个字段包含 name、type、nullable 等信息
 */
async function getTableFields(table_name) {
  try {
    const result = await Database.raw('SHOW COLUMNS FROM ??', [table_name])
    return result[0].map((field) => ({
      name: field.Field,
      type: field.Type,
      nullable: field.Null === 'YES',
      key: field.Key,
      default: field.Default,
      extra: field.Extra,
    }))
  } catch (err) {
    log.error('获取表字段错误:', err)
    throw new Error('获取表字段失败: ' + err.message)
  }
}

/**
 * 测试表名提取功能
 */
async function testTableExtraction() {
  const testCases = [
    {
      sql: 'SELECT * FROM users',
      expected: [{ name: 'users', alias: 'users' }],
    },
    {
      sql: 'SELECT * FROM users AS u',
      expected: [{ name: 'users', alias: 'u' }],
    },
    {
      sql: 'SELECT * FROM users u',
      expected: [{ name: 'users', alias: 'u' }],
    },
    {
      sql: 'SELECT id, name FROM users WHERE status = 1',
      expected: [{ name: 'users', alias: 'users' }],
    },
  ]

  console.log('开始测试表名提取功能...')
  for (const testCase of testCases) {
    const result = extractTableNames(testCase.sql)
    console.log('\n测试用例:', testCase.sql)
    console.log('期望结果:', JSON.stringify(testCase.expected))
    console.log('实际结果:', JSON.stringify(result))
  }
}

module.exports = {
  extractFieldDefinitions,
  extractTableNames,
  extractTableAndAlias,
  getFieldType,
  hasLimit,
  extractFields,
  validateTable,
  getTableFields,
  testTableExtraction,
}
