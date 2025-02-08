const { test } = require('@japa/runner')
const { assert } = require('@japa/assert')
const SqlParser = require('../core/parser')
const { ERROR_CODES } = require('../core/errors')
const Logger = require('../utils/logger')
const Database = use('Database')

// 测试辅助函数
function createParser(options = {}) {
  const logger = new Logger({
    module: 'SqlParser',
    debug_enabled: true, // 默认开启调试日志
  })
  console.log('创建Parser实例，日志配置:', { debug_enabled: true })
  return new SqlParser({ ...options, logger })
}

test.group('SqlParser | 临时测试', () => {
  test('should parse simple SELECT query', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      console.log('Database.raw called with:', { sql, params })
      if (sql.includes('SHOW FULL COLUMNS') && params[0] === 'news') {
        const result = [
          {
            Field: 'id',
            Type: 'int(11)',
            Null: 'NO',
            Key: 'PRI',
            Default: null,
            Extra: 'auto_increment',
            Comment: '主键ID',
          },
          {
            Field: 'title',
            Type: 'varchar(255)',
            Null: 'NO',
            Key: '',
            Default: null,
            Extra: '',
            Comment: '标题',
          },
          {
            Field: 'content',
            Type: 'varchar(255)',
            Null: 'YES',
            Key: '',
            Default: null,
            Extra: '',
            Comment: '内容',
          },
        ]
        console.log('Mock: 返回news表字段信息:', { raw_result: [result], fields_count: result.length })
        return [result] // 返回格式: [ [] ]，第一个元素是记录数组
      }
      console.log('Mock: 返回空结果:', { raw_result: [[]] })
      return [[]]
    }

    const parser = createParser()

    const sql = `
      SELECT
        id,
        title,
        content
      FROM news
    `

    console.log('Parsing SQL:', sql)
    const result = await parser.parse(sql)
    console.log('Parse result:', JSON.stringify(result, null, 2))

    // 验证表信息
    console.log('Validating tables...')
    assert.deepEqual(result.tables, [
      {
        name: 'news',
        alias: 'news',
        type: 'main',
        on: null,
      },
    ])

    // 验证字段信息
    console.log('Validating fields...')
    const expectedFields = [
      {
        original: 'id',
        alias: 'id',
        type: 'string',
        name: 'id',
        required: true,
        comment: '主键ID',
        html_type: 'text',
        form_type: 'text',
        validation: {
          notEmpty: {
            message: 'please enter in the correct format',
          },
        },
        editable: false,
        listable: true,
        searchable: false,
      },
      {
        original: 'title',
        alias: 'title',
        type: 'string',
        name: 'title',
        required: true,
        comment: '标题',
        html_type: 'text',
        form_type: 'text',
        validation: {
          notEmpty: {
            message: 'please enter in the correct format',
          },
        },
        editable: true,
        listable: true,
        searchable: true,
      },
      {
        original: 'content',
        alias: 'content',
        type: 'string',
        name: 'content',
        required: false,
        comment: '内容',
        html_type: 'email',
        form_type: 'text',
        validation: {
          emailAddress: {
            message: 'please enter in the correct format',
          },
        },
        editable: true,
        listable: true,
        searchable: true,
      },
    ]

    // 逐个字段对比，方便定位问题
    for (let i = 0; i < expectedFields.length; i++) {
      const expected = expectedFields[i]
      const actual = result.fields[i]
      console.log(`\nComparing field ${i + 1}: ${expected.name}`)
      console.log('Expected:', JSON.stringify(expected, null, 2))
      console.log('Actual:', JSON.stringify(actual, null, 2))
      assert.deepEqual(actual, expected, `Field ${expected.name} does not match`)
    }
  })
})
