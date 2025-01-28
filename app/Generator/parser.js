'use strict'

const Database = use('Database')
const log = use('Logger')

/**
 * 从 SQL 查询语句中提取字段定义
 * @param {string} sql_query SQL 查询语句
 * @returns {Array<{original: string, alias: string}>} 字段定义列表
 */
function extractFieldDefinitions(sql_query) {
  // 将多行 SQL 转换为单行，去除多余空格
  const sql = sql_query.replace(/\s+/g, ' ').trim()

  // 提取 SELECT 和 FROM 之间的部分
  const selectMatch = sql.match(/select\s+(.+?)\s+from\s+/i)
  if (!selectMatch) {
    throw new Error('无效的 SQL 查询语句')
  }

  const fieldsPart = selectMatch[1]
  const fields = []

  // 使用状态机解析字段定义，处理括号、引号等特殊情况
  let current = ''
  let inQuote = false
  let inBracket = 0
  let separator = false

  for (let i = 0; i < fieldsPart.length; i++) {
    const char = fieldsPart[i]

    if (char === '"' || char === "'") {
      inQuote = !inQuote
    } else if (char === '(') {
      inBracket++
    } else if (char === ')') {
      inBracket--
    } else if (char === ',' && !inQuote && inBracket === 0) {
      separator = true
    }

    if (separator) {
      if (current.trim()) {
        fields.push(parseFieldDefinition(current.trim()))
      }
      current = ''
      separator = false
    } else {
      current += char
    }
  }

  // 添加最后一个字段
  if (current.trim()) {
    fields.push(parseFieldDefinition(current.trim()))
  }

  return fields
}

/**
 * 解析单个字段定义
 * @param {string} fieldDef 字段定义
 * @returns {{original: string, alias: string, type: string}} 解析结果
 */
function parseFieldDefinition(fieldDef) {
  // 去除首尾空格
  fieldDef = fieldDef.trim()

  // 1. 处理 AS 别名（大小写不敏感）
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
  const dotMatch = fieldDef.match(/^(?:\w+\.)?(\w+)$/)
  if (dotMatch) {
    return {
      original: fieldDef,
      alias: dotMatch[1],
      type: getFieldType(fieldDef),
    }
  }

  // 4. 其他情况（函数、表达式等），需要生成一个别名
  return {
    original: fieldDef,
    alias: fieldDef
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_') // 非法字符转为下划线
      .replace(/_+/g, '_') // 多个下划线合并
      .replace(/^_+|_+$/g, ''), // 去除首尾下划线
    type: getFieldType(fieldDef),
  }
}

/**
 * 判断字段类型
 * @param {string} fieldDef 字段定义
 * @returns {string} 字段类型
 */
function getFieldType(fieldDef) {
  // 转换为小写便于匹配
  const def = fieldDef.toLowerCase()

  // 1. 数值类型函数
  if (def.match(/^(count|sum|avg|min|max)\s*\(/i) || def.match(/\b(decimal|numeric|int|float|double)\b/i)) {
    return 'number'
  }

  // 2. 日期时间类型
  if (def.match(/^(now|curdate|date_format|date|time|timestamp)\s*\(/i) || def.match(/\b(datetime|timestamp)\b/i)) {
    return 'datetime'
  }

  // 3. 布尔类型
  if (def.match(/\b(bool|boolean|true|false)\b/i) || def.match(/\b(if|ifnull|case)\b/i)) {
    return 'boolean'
  }

  // 4. 默认为字符串类型
  return 'string'
}

/**
 * 从 SQL 查询语句中提取表名
 * @param {string} sql_query SQL 查询语句
 * @returns {Array<{name: string, alias: string}>} 表名和别名列表
 */
function extractTableNames(sql_query) {
  // 将多行 SQL 转换为单行，去除多余空格
  const sql = sql_query.replace(/\s+/g, ' ').trim().toLowerCase()
  const tables = []

  // 1. 提取 FROM 子句
  const fromPart = sql.match(/\bfrom\b(.*?)(?:\bwhere\b|\bgroup by\b|\bhaving\b|\border by\b|\blimit\b|$)/i)
  if (!fromPart) {
    throw new Error('无效的 SQL 查询语句：缺少 FROM 子句')
  }

  // 2. 分割 JOIN 子句
  const fromClause = fromPart[1].trim()
  const joinParts = fromClause.split(/\b(left|right|inner|cross)?\s*join\b/i)

  // 3. 处理主表（第一个表）
  const mainTable = extractTableAndAlias(joinParts[0])
  if (mainTable) {
    tables.push(mainTable)
  }

  // 4. 处理 JOIN 的表
  for (let i = 1; i < joinParts.length; i += 2) {
    // joinParts[i] 是 join 类型（可能为空，表示普通 JOIN）
    // joinParts[i + 1] 是表定义（如果存在）
    if (joinParts[i + 1]) {
      // 去除 ON 条件部分
      const tablePart = joinParts[i + 1].split(/\bon\b/i)[0].trim()
      const joinedTable = extractTableAndAlias(tablePart)
      if (joinedTable) {
        tables.push(joinedTable)
      }
    }
  }

  return tables
}

/**
 * 从表定义中提取表名和别名
 * @param {string} tableDef 表定义，如 "table_name"、"table_name AS alias" 或 "table_name alias"
 * @returns {{name: string, alias: string} | null} 表名和别名，如果解析失败返回 null
 */
function extractTableAndAlias(tableDef) {
  if (!tableDef) return null

  // 去除首尾空格
  tableDef = tableDef.trim()

  // 1. 处理 AS 别名（大小写不敏感）
  const asMatch = tableDef.match(/^(\w+)\s+as\s+(\w+)/i)
  if (asMatch) {
    return {
      name: asMatch[1],
      alias: asMatch[2],
    }
  }

  // 2. 处理空格别名
  const spaceMatch = tableDef.match(/^(\w+)\s+(\w+)$/)
  if (spaceMatch) {
    return {
      name: spaceMatch[1],
      alias: spaceMatch[2],
    }
  }

  // 3. 无别名
  const nameMatch = tableDef.match(/^(\w+)$/)
  if (nameMatch) {
    return {
      name: nameMatch[1],
      alias: nameMatch[1],
    }
  }

  return null
}

/**
 * 检查 SQL 是否已包含 LIMIT 子句
 * @param {string} sql_query SQL 查询语句
 * @returns {boolean} 是否包含 LIMIT
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
  hasLimit,
  extractFields,
  validateTable,
  getTableFields,
  testTableExtraction,
}
