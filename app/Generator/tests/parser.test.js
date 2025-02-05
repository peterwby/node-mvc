'use strict'

const test = require('japa')
const SqlParser = require('../core/parser')
const Database = use('Database')
const { ERROR_CODES } = require('@Generator/core/errors')
const { GeneratorError } = require('@Generator/core/errors')

// 使用独立的测试环境，避免依赖框架
process.env.NODE_ENV = 'testing'

test.group('Generator/SqlParser', (group) => {
  let parser

  group.beforeEach(() => {
    parser = new SqlParser()
  })

  test('should parse simple SELECT query', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      return [
        [
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
            Field: 'name',
            Type: 'varchar(255)',
            Null: 'NO',
            Key: '',
            Default: null,
            Extra: '',
            Comment: '用户名',
          },
          {
            Field: 'email',
            Type: 'varchar(255)',
            Null: 'YES',
            Key: '',
            Default: null,
            Extra: '',
            Comment: '邮箱',
          },
        ],
      ]
    }

    const sql = `
      SELECT
        id,
        name,
        email
      FROM users
    `
    const result = await parser.parse(sql)

    // 验证表信息
    assert.deepEqual(result.tables, [
      {
        name: 'users',
        alias: 'users',
        type: 'main',
        on: null,
      },
    ])

    // 验证字段信息
    assert.deepEqual(result.fields, [
      {
        original: 'id',
        alias: 'id',
        type: 'string',
        required: true,
        comment: '主键ID',
        html_type: 'text',
        form_type: 'text',
        validation: {
          notEmpty: {
            message: 'please enter in the correct format',
          },
        },
        searchable: false,
        editable: false,
        listable: true,
      },
      {
        original: 'name',
        alias: 'name',
        type: 'string',
        required: true,
        comment: '用户名',
        html_type: 'text',
        form_type: 'text',
        validation: {
          notEmpty: {
            message: 'please enter in the correct format',
          },
        },
        searchable: true,
        editable: true,
        listable: true,
      },
      {
        original: 'email',
        alias: 'email',
        type: 'string',
        required: false,
        comment: '邮箱',
        html_type: 'email',
        form_type: 'text',
        validation: {
          emailAddress: {
            message: 'please enter in the correct format',
          },
        },
        searchable: true,
        editable: true,
        listable: true,
      },
    ])
  })

  test('should parse complex SELECT query with joins', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      if (params[0] === 'orders') {
        return [
          [
            {
              Field: 'id',
              Type: 'int(11)',
              Null: 'NO',
              Key: 'PRI',
              Default: null,
              Extra: 'auto_increment',
              Comment: '订单ID',
            },
            {
              Field: 'order_no',
              Type: 'varchar(50)',
              Null: 'NO',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '订单号',
            },
            {
              Field: 'customer_id',
              Type: 'int(11)',
              Null: 'NO',
              Key: 'MUL',
              Default: null,
              Extra: '',
              Comment: '客户ID',
            },
          ],
        ]
      }
      if (params[0] === 'customers') {
        return [
          [
            {
              Field: 'id',
              Type: 'int(11)',
              Null: 'NO',
              Key: 'PRI',
              Default: null,
              Extra: 'auto_increment',
              Comment: '客户ID',
            },
            {
              Field: 'name',
              Type: 'varchar(255)',
              Null: 'NO',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '客户名称',
            },
          ],
        ]
      }
      if (params[0] === 'order_items') {
        return [
          [
            {
              Field: 'id',
              Type: 'int(11)',
              Null: 'NO',
              Key: 'PRI',
              Default: null,
              Extra: 'auto_increment',
              Comment: '订单项ID',
            },
            {
              Field: 'order_id',
              Type: 'int(11)',
              Null: 'NO',
              Key: 'MUL',
              Default: null,
              Extra: '',
              Comment: '订单ID',
            },
            {
              Field: 'quantity',
              Type: 'int(11)',
              Null: 'NO',
              Key: '',
              Default: '1',
              Extra: '',
              Comment: '数量',
            },
            {
              Field: 'price',
              Type: 'decimal(10,2)',
              Null: 'NO',
              Key: '',
              Default: '0.00',
              Extra: '',
              Comment: '单价',
            },
          ],
        ]
      }
      return [[]]
    }

    const sql = `
      SELECT
        o.id as order_id,
        o.order_no,
        c.name as customer_name,
        COUNT(i.id) as total_items,
        SUM(i.quantity * i.price) as total_amount,
        CASE
          WHEN SUM(i.quantity * i.price) > 1000 THEN 'VIP'
          WHEN SUM(i.quantity * i.price) > 500 THEN 'Regular'
          ELSE 'Normal'
        END as customer_level,
        DATE_FORMAT(o.created_at, '%Y-%m-%d') as order_date
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN order_items i ON i.order_id = o.id
      GROUP BY o.id, o.order_no, c.name
    `
    const result = await parser.parse(sql)

    // 验证表信息
    assert.deepEqual(result.tables, [
      {
        name: 'orders',
        alias: 'o',
        type: 'main',
        on: null,
      },
      {
        name: 'customers',
        alias: 'c',
        type: 'left',
        on: 'c.id = o.customer_id',
      },
      {
        name: 'order_items',
        alias: 'i',
        type: 'left',
        on: 'i.order_id = o.id',
      },
    ])

    // 验证字段信息
    assert.deepEqual(result.fields, [
      {
        original: 'o.id',
        alias: 'order_id',
        type: 'string',
        required: true,
        comment: '订单ID',
        html_type: 'text',
        form_type: 'text',
        validation: {
          notEmpty: {
            message: 'please enter in the correct format',
          },
        },
        searchable: false,
        editable: false,
        listable: true,
      },
      {
        original: 'o.order_no',
        alias: 'order_no',
        type: 'string',
        required: true,
        comment: '订单号',
        html_type: 'text',
        form_type: 'text',
        validation: {
          notEmpty: {
            message: 'please enter in the correct format',
          },
        },
        searchable: true,
        editable: true,
        listable: true,
      },
      {
        original: 'c.name',
        alias: 'customer_name',
        type: 'string',
        required: true,
        comment: '客户名称',
        html_type: 'text',
        form_type: 'text',
        validation: {
          notEmpty: {
            message: 'please enter in the correct format',
          },
        },
        searchable: true,
        editable: true,
        listable: true,
      },
      {
        original: 'COUNT(i.id)',
        alias: 'total_items',
        type: 'number',
        required: false,
        comment: 'total_items',
        html_type: 'number',
        form_type: 'text',
        validation: {},
        searchable: true,
        editable: true,
        listable: true,
      },
      {
        original: 'SUM(i.quantity * i.price)',
        alias: 'total_amount',
        type: 'number',
        required: false,
        comment: 'total_amount',
        html_type: 'number',
        form_type: 'text',
        validation: {},
        searchable: true,
        editable: true,
        listable: true,
      },
      {
        original: "CASE WHEN SUM(i.quantity * i.price) > 1000 THEN 'VIP' WHEN SUM(i.quantity * i.price) > 500 THEN 'Regular' ELSE 'Normal' END",
        alias: 'customer_level',
        type: 'string',
        required: false,
        comment: 'customer_level',
        html_type: 'text',
        form_type: 'select',
        validation: {},
        searchable: true,
        editable: true,
        listable: true,
      },
      {
        original: "DATE_FORMAT(o.created_at, '%Y-%m-%d')",
        alias: 'order_date',
        type: 'datetime',
        required: false,
        comment: 'order_date',
        html_type: 'date',
        form_type: 'text',
        validation: {},
        searchable: true,
        editable: true,
        listable: true,
      },
    ])
  })

  test('should handle field type inference errors', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      return [[]]
    }

    const sql = `
      SELECT
        (SELECT COUNT(*) FROM orders) + 'invalid' as test1,
        DATE_FORMAT(created_at, '%Y-%m-%d') + 1 as test2
      FROM users
    `
    const result = await parser.parse(sql)
    assert.deepEqual(result.fields, [
      {
        original: "[object Object] + 'invalid'",
        alias: 'test1',
        type: 'boolean',
        required: false,
        comment: 'test1',
        html_type: 'checkbox',
        form_type: 'text',
        validation: {},
        searchable: true,
        editable: true,
        listable: true,
      },
      {
        original: "DATE_FORMAT(created_at, '%Y-%m-%d') + 1",
        alias: 'test2',
        type: 'boolean',
        required: false,
        comment: 'test2',
        html_type: 'checkbox',
        form_type: 'text',
        validation: {},
        searchable: true,
        editable: true,
        listable: true,
      },
    ])
  })

  test('should handle complex function expressions with errors', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      return [[]]
    }

    const sql = `
      SELECT
        CUSTOM_FUNC(id, name) as test1,
        UNKNOWN_FUNC(status) as test2,
        CONCAT(first_name, COALESCE(middle_name, ''), last_name) as full_name
      FROM users
    `
    const result = await parser.parse(sql)
    assert.deepEqual(result.fields, [
      {
        original: 'CUSTOM_FUNC(id, name)',
        alias: 'test1',
        type: 'string',
        required: false,
        comment: 'test1',
        html_type: 'text',
        form_type: 'text',
        validation: {},
        searchable: true,
        editable: true,
        listable: true,
      },
      {
        original: 'UNKNOWN_FUNC(status)',
        alias: 'test2',
        type: 'string',
        required: false,
        comment: 'test2',
        html_type: 'text',
        form_type: 'text',
        validation: {},
        searchable: true,
        editable: true,
        listable: true,
      },
      {
        original: "CONCAT(first_name, COALESCE(middle_name, ''), last_name)",
        alias: 'full_name',
        type: 'string',
        required: false,
        comment: 'full_name',
        html_type: 'text',
        form_type: 'text',
        validation: {},
        searchable: true,
        editable: true,
        listable: true,
      },
    ])
  })

  test('should parse query with aliases', async ({ assert }) => {
    const sql = 'SELECT u.id as user_id, u.name as user_name FROM users u'
    const result = parser.parse(sql)

    assert.deepEqual(result.tables, [{ name: 'users', alias: 'u', type: 'main', on: null }])

    assert.deepEqual(result.fields, [
      { original: 'u.id', alias: 'user_id', type: 'string' },
      { original: 'u.name', alias: 'user_name', type: 'string' },
    ])
  })

  test('should parse join query', async ({ assert }) => {
    const sql = `
      SELECT
        o.id as order_id,
        o.order_no,
        c.name as customer_name
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
    `
    const result = parser.parse(sql)
    assert.equal(result.tables.length, 2)
    assert.equal(result.fields.length, 3)
  })

  test('should reject empty SQL', async ({ assert }) => {
    try {
      parser.parse('')
      assert.fail('Should throw error')
    } catch (err) {
      assert.equal(err.code, ERROR_CODES.EMPTY_SQL)
    }
  })

  test('should reject SELECT *', async ({ assert }) => {
    try {
      parser.parse('SELECT * FROM users')
      assert.fail('Should throw error')
    } catch (err) {
      assert.equal(err.code, ERROR_CODES.INVALID_SQL)
    }
  })

  test('should allow COUNT(*)', async ({ assert }) => {
    const sql = 'SELECT COUNT(*) as total FROM users'
    const result = parser.parse(sql)

    assert.deepEqual(result.fields, [{ original: 'COUNT(*)', alias: 'total', type: 'number' }])
  })

  test('should parse function expressions', async ({ assert }) => {
    const sql = `
      SELECT
        COUNT(*) as total_count,
        SUM(amount) as total_amount,
        DATE_FORMAT(created_at, '%Y-%m-%d') as date
      FROM orders
    `
    const result = parser.parse(sql)
    assert.equal(result.fields.length, 3)
    assert.equal(result.fields[0].alias, 'total_count')
    assert.equal(result.fields[1].alias, 'total_amount')
    assert.equal(result.fields[2].alias, 'date')
  })

  test('should parse complex join query with aggregations and case expressions', async ({ assert }) => {
    const sql = `
      SELECT
        o.id as order_id,
        o.order_no,
        c.name as customer_name,
        COUNT(i.id) as total_items,
        SUM(i.quantity * i.price) as total_amount,
        CASE
          WHEN SUM(i.quantity * i.price) > 1000 THEN 'VIP'
          WHEN SUM(i.quantity * i.price) > 500 THEN 'Regular'
          ELSE 'Normal'
        END as customer_level,
        DATE_FORMAT(o.created_at, '%Y-%m-%d') as order_date
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN order_items i ON i.order_id = o.id
      WHERE o.status = 'completed'
      GROUP BY o.id, o.order_no, c.name, o.created_at
      HAVING SUM(i.quantity * i.price) > 0
      ORDER BY total_amount DESC
    `

    const result = parser.parse(sql)

    // 验证表信息
    assert.deepEqual(result.tables, [
      { name: 'orders', alias: 'o', type: 'main', on: null },
      { name: 'customers', alias: 'c', type: 'left', on: 'c.id = o.customer_id' },
      { name: 'order_items', alias: 'i', type: 'left', on: 'i.order_id = o.id' },
    ])

    // 验证字段信息
    assert.deepEqual(result.fields, [
      { original: 'o.id', alias: 'order_id', type: 'string' },
      { original: 'o.order_no', alias: 'order_no', type: 'string' },
      { original: 'c.name', alias: 'customer_name', type: 'string' },
      { original: 'COUNT(i.id)', alias: 'total_items', type: 'number' },
      { original: 'SUM(i.quantity * i.price)', alias: 'total_amount', type: 'number' },
      {
        original: "CASE WHEN SUM(i.quantity * i.price) > 1000 THEN 'VIP' WHEN SUM(i.quantity * i.price) > 500 THEN 'Regular' ELSE 'Normal' END",
        alias: 'customer_level',
        type: 'string',
      },
      { original: "DATE_FORMAT(o.created_at, '%Y-%m-%d')", alias: 'order_date', type: 'datetime' },
    ])
  })

  test('should parse boolean expressions and functions', async ({ assert }) => {
    const sql = `
      SELECT
        id,
        IF(age > 18, 'Adult', 'Minor') as age_group,
        IFNULL(nickname, username) as display_name,
        is_active,
        CASE
          WHEN balance > 1000 THEN true
          ELSE false
        END as is_rich
      FROM users
    `
    const result = parser.parse(sql)

    assert.deepEqual(result.fields, [
      { original: 'id', alias: 'id', type: 'string' },
      { original: "IF(age > 18, 'Adult', 'Minor')", alias: 'age_group', type: 'boolean' },
      { original: 'IFNULL(nickname, username)', alias: 'display_name', type: 'boolean' },
      { original: 'is_active', alias: 'is_active', type: 'boolean' },
      {
        original: 'CASE WHEN balance > 1000 THEN true ELSE false END',
        alias: 'is_rich',
        type: 'boolean',
      },
    ])
  })

  test('should reject invalid expressions', async ({ assert }) => {
    try {
      parser.parse(`
        SELECT
          id,
          INVALID_FUNC(name) as test1,
          (1 + ) as test2
        FROM users
      `)
      assert.fail('Should throw error')
    } catch (err) {
      assert.equal(err.code, ERROR_CODES.INVALID_SQL)
      assert.isTrue(err.message.includes('SQL语句格式错误'))
    }
  })

  test('should parse different data types', async ({ assert }) => {
    const sql = `
      SELECT
        CAST(id AS INTEGER) as id_num,
        CAST(price AS DECIMAL) as price_num,
        CAST(is_active AS TINYINT) as is_active_bool,
        CAST(created_at AS DATETIME) as created_dt
      FROM products
    `
    const result = parser.parse(sql)
    assert.equal(result.fields.length, 4)
    assert.deepEqual(result.fields, [
      { original: 'CAST(id AS INTEGER)', alias: 'id_num', type: 'number' },
      { original: 'CAST(price AS DECIMAL)', alias: 'price_num', type: 'number' },
      { original: 'CAST(is_active AS TINYINT)', alias: 'is_active_bool', type: 'boolean' },
      { original: 'CAST(created_at AS DATETIME)', alias: 'created_dt', type: 'datetime' },
    ])
  })

  test('should handle various expression types', async ({ assert }) => {
    const sql = `
      SELECT
        NULL as null_value,
        'test' as string_value,
        123 as number_value,
        true as bool_value,
        CONCAT(first_name, ' ', last_name) as full_name
      FROM users
    `
    const result = parser.parse(sql)
    assert.deepEqual(result.fields[0], {
      original: 'NULL',
      alias: 'null_value',
      type: 'string',
    })
    assert.deepEqual(result.fields[1], {
      original: "'test'",
      alias: 'string_value',
      type: 'string',
    })
    assert.deepEqual(result.fields[2], {
      original: '123',
      alias: 'number_value',
      type: 'number',
    })
    assert.deepEqual(result.fields[3], {
      original: 'true',
      alias: 'bool_value',
      type: 'boolean',
    })
    assert.deepEqual(result.fields[4], {
      original: "CONCAT(first_name, ' ', last_name)",
      alias: 'full_name',
      type: 'string',
    })
  })

  test('should handle invalid CAST expressions', async ({ assert }) => {
    const sql = `
      SELECT
        CAST(id AS INVALID_TYPE) as test1,
        CAST(name) as test2
      FROM users
    `
    try {
      parser.parse(sql)
      assert.fail('Should throw error')
    } catch (err) {
      assert.equal(err.code, ERROR_CODES.INVALID_SQL)
      assert.include(err.message, 'SQL语句格式错误')
    }
  })

  test('should handle complex expressions with errors', async ({ assert }) => {
    const sql = `
      SELECT
        CASE WHEN id > 0 THEN 'Valid' END as case_without_else,
        COALESCE(NULL, name, 'Unknown') as coalesce_value,
        NULLIF(status, 'inactive') as nullif_value
      FROM users
    `
    const result = parser.parse(sql)
    assert.equal(result.fields.length, 3)
  })

  test('should handle INSERT/UPDATE/DELETE statements', async ({ assert }) => {
    try {
      parser.parse('INSERT INTO users (name) VALUES ("test")')
      assert.fail('Should throw error')
    } catch (err) {
      assert.equal(err.code, ERROR_CODES.UNSUPPORTED_SQL)
      assert.isTrue(err.message.includes('仅支持SELECT语句'))
    }
  })

  test('should handle malformed SQL with detailed error', async ({ assert }) => {
    try {
      parser.parse('SELECT FROM WHERE')
      assert.fail('Should throw error')
    } catch (err) {
      assert.equal(err.code, ERROR_CODES.INVALID_SQL)
      assert.isTrue(err.message.includes('SQL语句格式错误'))
    }
  })

  test('should handle complex table references', async ({ assert }) => {
    const sql = `
      SELECT
        t1.id,
        t2.name,
        t3.value
      FROM
        table1 t1
        INNER JOIN table2 t2 ON t1.id = t2.id
        RIGHT JOIN table3 t3 ON t2.id = t3.id
        LEFT JOIN table4 t4 ON t3.id = t4.id
      WHERE t1.id > 0
    `
    const result = parser.parse(sql)
    assert.equal(result.tables.length, 4)
    assert.equal(result.tables[0].type, 'main')
    assert.equal(result.tables[1].type, 'inner')
    assert.equal(result.tables[2].type, 'right')
    assert.equal(result.tables[3].type, 'left')
  })

  test('should handle complex function expressions', async ({ assert }) => {
    const sql = `
      SELECT
        CONCAT(first_name, ' ', last_name) as full_name,
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(*) as total,
        CUSTOM_FUNC(id, name, age) as custom
      FROM users
    `
    const result = parser.parse(sql)
    assert.equal(result.fields.length, 4)
    assert.deepEqual(result.fields[0], {
      original: "CONCAT(first_name, ' ', last_name)",
      alias: 'full_name',
      type: 'string',
    })
    assert.deepEqual(result.fields[1], {
      original: "DATE_FORMAT(created_at, '%Y-%m-%d')",
      alias: 'date',
      type: 'datetime',
    })
    assert.deepEqual(result.fields[2], {
      original: 'COUNT(*)',
      alias: 'total',
      type: 'number',
    })
    assert.deepEqual(result.fields[3], {
      original: 'CUSTOM_FUNC(id, name, age)',
      alias: 'custom',
      type: 'string',
    })
  })

  test('should handle edge cases in CAST expressions', async ({ assert }) => {
    const sql = `
      SELECT
        CAST(id AS UNKNOWN_TYPE) as test1,
        CAST(name AS INVALID) as test2,
        CAST(CONCAT(a, b) AS CHAR) as test3
      FROM users
    `
    try {
      parser.parse(sql)
      assert.fail('Should throw error')
    } catch (err) {
      assert.equal(err.code, ERROR_CODES.INVALID_SQL)
      assert.include(err.message, 'SQL语句格式错误')
    }
  })

  test('should handle complex expressions with errors', async ({ assert }) => {
    const sql = `
      SELECT
        (SELECT 1) as subquery,
        {invalid} as invalid_json,
        [1, 2, 3] as array
      FROM users
    `
    try {
      parser.parse(sql)
      assert.fail('Should throw error')
    } catch (err) {
      assert.equal(err.code, ERROR_CODES.INVALID_SQL)
      assert.include(err.message, 'SQL语句格式错误')
    }
  })

  test('should handle CAST expressions with missing target type', async ({ assert }) => {
    const sql = `
      SELECT
        CAST(id) as test1,
        CAST(name AS CHAR) as test2
      FROM users
    `
    const result = parser.parse(sql)
    assert.equal(result.fields[0].type, 'string')
    assert.equal(result.fields[1].type, 'string')
  })

  test('should handle CAST expressions with invalid target type', async ({ assert }) => {
    const sql = `
      SELECT
        CAST(id AS CHAR) as test1,
        CAST(name AS VARCHAR) as test2,
        CAST(status AS TEXT) as test3
      FROM users
    `
    const result = parser.parse(sql)
    assert.equal(result.fields[0].type, 'string')
    assert.equal(result.fields[1].type, 'string')
    assert.equal(result.fields[2].type, 'string')
  })

  test('should handle complex function expressions with errors', async ({ assert }) => {
    const sql = `
      SELECT
        CONCAT(first_name, ' ', last_name) as full_name,
        COALESCE(NULL, '', 'Unknown') as display_name,
        NULLIF(status, '') as status,
        IF(age > 18, 'Adult', 'Minor') as age_group
      FROM users
    `
    const result = parser.parse(sql)
    assert.equal(result.fields[0].type, 'string')
    assert.equal(result.fields[1].type, 'string')
    assert.equal(result.fields[2].type, 'string')
    assert.equal(result.fields[3].type, 'boolean')
  })

  test('should handle expression stringification errors', async ({ assert }) => {
    const sql = `
      SELECT
        CASE
          WHEN id > 0 THEN 'Valid'
          WHEN status = 'active' THEN 'Active'
          ELSE 'Invalid'
        END as complex_case,
        IF(
          (SELECT COUNT(*) FROM orders WHERE user_id = users.id) > 0,
          'Has orders',
          'No orders'
        ) as order_status
      FROM users
    `
    const result = parser.parse(sql)
    assert.deepEqual(result.fields, [
      {
        original: "CASE WHEN id > 0 THEN 'Valid' WHEN status = 'active' THEN 'Active' ELSE 'Invalid' END",
        alias: 'complex_case',
        type: 'string',
      },
      {
        original: "IF([object Object] > 0, 'Has orders', 'No orders')",
        alias: 'order_status',
        type: 'boolean',
      },
    ])
  })

  test('should handle unknown CAST target types', async ({ assert }) => {
    const sql = `
      SELECT
        CAST(id AS CUSTOM_TYPE) as test1,
        CAST(name AS UNKNOWN) as test2
      FROM users
    `
    assert.throws(() => parser.parse(sql), GeneratorError)
  })

  test('should handle field type inference errors', async ({ assert }) => {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM orders) + 'invalid' as test1,
        DATE_FORMAT(created_at, '%Y-%m-%d') + 1 as test2
      FROM users
    `
    const result = parser.parse(sql)
    assert.deepEqual(result.fields, [
      { original: "[object Object] + 'invalid'", alias: 'test1', type: 'boolean' },
      { original: "DATE_FORMAT(created_at, '%Y-%m-%d') + 1", alias: 'test2', type: 'boolean' },
    ])
  })

  test('should handle complex function expressions with errors', async ({ assert }) => {
    const sql = `
      SELECT
        CUSTOM_FUNC(id, name) as test1,
        UNKNOWN_FUNC(status) as test2,
        CONCAT(first_name, COALESCE(middle_name, ''), last_name) as full_name
      FROM users
    `
    const result = parser.parse(sql)
    assert.deepEqual(result.fields, [
      { original: 'CUSTOM_FUNC(id, name)', alias: 'test1', type: 'string' },
      { original: 'UNKNOWN_FUNC(status)', alias: 'test2', type: 'string' },
      { original: "CONCAT(first_name, COALESCE(middle_name, ''), last_name)", alias: 'full_name', type: 'string' },
    ])
  })
})
