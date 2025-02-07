'use strict'

const { test } = require('@japa/runner')
const SqlParser = require('../core/parser')
const Database = use('Database')
const { ERROR_CODES } = require('@Generator/core/errors')
const { GeneratorError } = require('@Generator/core/errors')

// 使用独立的测试环境，避免依赖框架
process.env.NODE_ENV = 'testing'

test.group('Generator/SqlParser', (group) => {
  let parser

  group.each.setup(() => {
    parser = new SqlParser()
  })

  test('should parse simple SELECT query', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      if (params[0] === 'users') {
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
      return [[]]
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
        original: 'name',
        alias: 'name',
        type: 'string',
        name: 'name',
        required: true,
        comment: '用户名',
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
        original: 'email',
        alias: 'email',
        type: 'string',
        name: 'email',
        required: false,
        comment: '邮箱',
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

  test('should parse query with aliases', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      if (params[0] === 'users') {
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
          ],
        ]
      }
      return [[]]
    }

    const sql = 'SELECT u.id as user_id, u.name as user_name FROM users u'
    const result = await parser.parse(sql)

    // 只验证基本属性
    const { tables, fields } = result
    const simplifiedFields = fields.map(({ original, alias, type }) => ({ original, alias, type }))

    assert.deepEqual(tables, [{ name: 'users', alias: 'u', type: 'main', on: null }])
    assert.deepEqual(simplifiedFields, [
      { original: 'u.id', alias: 'user_id', type: 'integer' },
      { original: 'u.name', alias: 'user_name', type: 'string' },
    ])
  })

  test('should parse join query', async ({ assert }) => {
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
              Type: 'varchar(255)',
              Null: 'NO',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '订单号',
            },
          ],
        ]
      } else if (params[0] === 'customers') {
        return [
          [
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
      return [[]]
    }

    const sql = `
      SELECT
        o.id as order_id,
        o.order_no,
        c.name as customer_name
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
    `
    const result = await parser.parse(sql)

    // 只验证基本属性
    const { tables, fields } = result
    const simplifiedFields = fields.map(({ original, alias, type }) => ({ original, alias, type }))

    assert.deepEqual(tables, [
      { name: 'orders', alias: 'o', type: 'main', on: null },
      { name: 'customers', alias: 'c', type: 'cross', on: 'c.id = o.customer_id' },
    ])

    assert.deepEqual(simplifiedFields, [
      { original: 'o.id', alias: 'order_id', type: 'integer' },
      { original: 'o.order_no', alias: 'order_no', type: 'string' },
      { original: 'c.name', alias: 'customer_name', type: 'string' },
    ])
  })

  test('should reject empty SQL', async ({ assert }) => {
    try {
      await parser.parse('')
      assert.fail('Should throw error')
    } catch (err) {
      assert.equal(err.code, ERROR_CODES.EMPTY_SQL)
    }
  })

  test('should reject SELECT *', async ({ assert }) => {
    try {
      await parser.parse('SELECT * FROM users')
      assert.fail('Should throw error')
    } catch (err) {
      assert.equal(err.code, ERROR_CODES.INVALID_SQL)
    }
  })

  test('should allow COUNT(*)', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      return [[]]
    }

    const sql = 'SELECT COUNT(*) as total FROM users'
    const result = await parser.parse(sql)

    // 只验证基本属性
    const { fields } = result
    const simplifiedFields = fields.map(({ original, alias, type }) => ({ original, alias, type }))

    assert.deepEqual(simplifiedFields, [{ original: 'COUNT(*)', alias: 'total', type: 'integer' }])
  })

  test('should parse function expressions', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      if (params[0] === 'orders') {
        return [
          [
            {
              Field: 'amount',
              Type: 'decimal(10,2)',
              Null: 'NO',
              Key: '',
              Default: '0.00',
              Extra: '',
              Comment: '金额',
            },
            {
              Field: 'created_at',
              Type: 'datetime',
              Null: 'NO',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '创建时间',
            },
          ],
        ]
      }
      return [[]]
    }

    const sql = `
      SELECT
        COUNT(*) as total_count,
        SUM(amount) as total_amount,
        DATE_FORMAT(created_at, '%Y-%m-%d') as field_date
      FROM orders
    `
    const result = await parser.parse(sql)

    // 只验证基本属性
    const { fields } = result
    const simplifiedFields = fields.map(({ original, alias, type }) => ({ original, alias, type }))

    assert.deepEqual(simplifiedFields, [
      { original: 'COUNT(*)', alias: 'total_count', type: 'integer' },
      { original: 'SUM(amount)', alias: 'total_amount', type: 'decimal' },
      { original: "DATE_FORMAT(created_at, '%Y-%m-%d')", alias: 'field_date', type: 'datetime' },
    ])
  })

  test('should parse boolean expressions and functions', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      if (params[0] === 'users') {
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
              Field: 'age',
              Type: 'int(11)',
              Null: 'YES',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '年龄',
            },
            {
              Field: 'nickname',
              Type: 'varchar(255)',
              Null: 'YES',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '昵称',
            },
            {
              Field: 'username',
              Type: 'varchar(255)',
              Null: 'NO',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '用户名',
            },
            {
              Field: 'is_active',
              Type: 'tinyint(1)',
              Null: 'NO',
              Key: '',
              Default: '1',
              Extra: '',
              Comment: '是否激活',
            },
            {
              Field: 'balance',
              Type: 'decimal(10,2)',
              Null: 'YES',
              Key: '',
              Default: '0.00',
              Extra: '',
              Comment: '余额',
            },
          ],
        ]
      }
      return [[]]
    }

    const sql = `
      SELECT
        id,
        IF(age > 18, 'Adult', 'Minor') as age_group,
        IFNULL(nickname, username) as display_name,
        is_active,
        CASE WHEN balance > 1000 THEN true ELSE false END as is_rich
      FROM users
    `
    const result = await parser.parse(sql)

    // 只验证基本属性
    const { fields } = result
    const simplifiedFields = fields.map(({ original, alias, type }) => ({ original, alias, type }))

    assert.deepEqual(simplifiedFields, [
      { original: 'id', alias: 'id', type: 'integer' },
      { original: "IF(age > 18, 'Adult', 'Minor')", alias: 'age_group', type: 'string' },
      { original: 'IFNULL(nickname, username)', alias: 'display_name', type: 'string' },
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
      await parser.parse(`
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
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      if (params[0] === 'products') {
        return [
          [
            {
              Field: 'id',
              Type: 'int(11)',
              Null: 'NO',
              Key: 'PRI',
              Default: null,
              Extra: 'auto_increment',
              Comment: '商品ID',
            },
            {
              Field: 'price',
              Type: 'decimal(10,2)',
              Null: 'NO',
              Key: '',
              Default: '0.00',
              Extra: '',
              Comment: '价格',
            },
            {
              Field: 'is_active',
              Type: 'tinyint(1)',
              Null: 'NO',
              Key: '',
              Default: '1',
              Extra: '',
              Comment: '是否激活',
            },
            {
              Field: 'created_at',
              Type: 'datetime',
              Null: 'NO',
              Key: '',
              Default: 'CURRENT_TIMESTAMP',
              Extra: '',
              Comment: '创建时间',
            },
          ],
        ]
      }
      return [[]]
    }

    const sql = `
      SELECT
        CAST(id AS INTEGER) as id_num,
        CAST(price AS DECIMAL) as price_num,
        CAST(is_active AS TINYINT) as is_active_bool,
        CAST(created_at AS DATETIME) as created_dt
      FROM products
    `
    const result = await parser.parse(sql)

    // 只验证基本属性
    const { fields } = result
    const simplifiedFields = fields.map(({ original, alias, type }) => ({ original, alias, type }))

    assert.deepEqual(simplifiedFields, [
      { original: 'CAST(id AS INTEGER)', alias: 'id_num', type: 'integer' },
      { original: 'CAST(price AS DECIMAL)', alias: 'price_num', type: 'decimal' },
      { original: 'CAST(is_active AS TINYINT)', alias: 'is_active_bool', type: 'boolean' },
      { original: 'CAST(created_at AS DATETIME)', alias: 'created_dt', type: 'datetime' },
    ])
  })

  test('should handle various expression types', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      if (params[0] === 'users') {
        return [
          [
            {
              Field: 'first_name',
              Type: 'varchar(255)',
              Null: 'NO',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '名',
            },
            {
              Field: 'last_name',
              Type: 'varchar(255)',
              Null: 'NO',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '姓',
            },
          ],
        ]
      }
      return [[]]
    }

    const sql = `
      SELECT
        NULL as null_value,
        'test' as string_value,
        123 as number_value,
        true as bool_value,
        CONCAT(first_name, ' ', last_name) as full_name
      FROM users
    `
    const result = await parser.parse(sql)

    // 只验证基本属性
    const { fields } = result
    const simplifiedFields = fields.map(({ original, alias, type }) => ({ original, alias, type }))

    assert.deepEqual(simplifiedFields, [
      { original: 'NULL', alias: 'null_value', type: 'string' },
      { original: "'test'", alias: 'string_value', type: 'string' },
      { original: '123', alias: 'number_value', type: 'integer' },
      { original: 'true', alias: 'bool_value', type: 'boolean' },
      { original: "CONCAT(first_name, ' ', last_name)", alias: 'full_name', type: 'string' },
    ])
  })

  test('should handle CAST expressions with missing target type', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      if (params[0] === 'users') {
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
          ],
        ]
      }
      return [[]]
    }

    const sql = `
      SELECT
        CAST(id) as test1,
        CAST(name AS CHAR) as test2
      FROM users
    `
    const result = await parser.parse(sql)

    // 只验证基本属性
    const { fields } = result
    const simplifiedFields = fields.map(({ original, alias, type }) => ({ original, alias, type }))

    assert.deepEqual(simplifiedFields, [
      { original: 'CAST(id)', alias: 'test1', type: 'string' },
      { original: 'CAST(name AS CHAR)', alias: 'test2', type: 'string' },
    ])
  })

  test('should handle CAST expressions with invalid target type', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      if (params[0] === 'users') {
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
              Field: 'status',
              Type: 'varchar(50)',
              Null: 'NO',
              Key: '',
              Default: 'active',
              Extra: '',
              Comment: '状态',
            },
          ],
        ]
      }
      return [[]]
    }

    const sql = `
      SELECT
        CAST(id AS CHAR) as test1,
        CAST(name AS VARCHAR) as test2,
        CAST(status AS TEXT) as test3
      FROM users
    `
    const result = await parser.parse(sql)

    // 只验证基本属性
    const { fields } = result
    const simplifiedFields = fields.map(({ original, alias, type }) => ({ original, alias, type }))

    assert.deepEqual(simplifiedFields, [
      { original: 'CAST(id AS CHAR)', alias: 'test1', type: 'string' },
      { original: 'CAST(name AS VARCHAR)', alias: 'test2', type: 'string' },
      { original: 'CAST(status AS TEXT)', alias: 'test3', type: 'string' },
    ])
  })

  test('should handle complex function expressions with errors', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      if (params[0] === 'users') {
        return [
          [
            {
              Field: 'first_name',
              Type: 'varchar(255)',
              Null: 'NO',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '名',
            },
            {
              Field: 'middle_name',
              Type: 'varchar(255)',
              Null: 'YES',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '中间名',
            },
            {
              Field: 'last_name',
              Type: 'varchar(255)',
              Null: 'NO',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '姓',
            },
            {
              Field: 'status',
              Type: 'varchar(50)',
              Null: 'NO',
              Key: '',
              Default: 'active',
              Extra: '',
              Comment: '状态',
            },
          ],
        ]
      }
      return [[]]
    }

    const sql = `
      SELECT
        CONCAT(first_name, ' ', last_name) as full_name,
        COALESCE(NULL, '', 'Unknown') as display_name,
        NULLIF(status, '') as status,
        IF(age > 18, 'Adult', 'Minor') as age_group
      FROM users
    `
    const result = await parser.parse(sql)

    // 只验证基本属性
    const { fields } = result
    const simplifiedFields = fields.map(({ original, alias, type }) => ({ original, alias, type }))

    assert.deepEqual(simplifiedFields, [
      { original: "CONCAT(first_name, ' ', last_name)", alias: 'full_name', type: 'string' },
      { original: "COALESCE(NULL, '', 'Unknown')", alias: 'display_name', type: 'string' },
      { original: "NULLIF(status, '')", alias: 'status', type: 'string' },
      { original: "IF(age > 18, 'Adult', 'Minor')", alias: 'age_group', type: 'string' },
    ])
  })

  test('should handle expression stringification errors', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      if (params[0] === 'users') {
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
              Field: 'status',
              Type: 'varchar(50)',
              Null: 'NO',
              Key: '',
              Default: 'active',
              Extra: '',
              Comment: '状态',
            },
          ],
        ]
      }
      return [[]]
    }

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
    const result = await parser.parse(sql)

    // 只验证基本属性
    const { fields } = result
    const simplifiedFields = fields.map(({ original, alias, type }) => ({ original, alias, type }))

    assert.deepEqual(simplifiedFields, [
      {
        original: "CASE WHEN id > 0 THEN 'Valid' WHEN status = 'active' THEN 'Active' ELSE 'Invalid' END",
        alias: 'complex_case',
        type: 'string',
      },
      {
        original: "IF([object Object] > 0, 'Has orders', 'No orders')",
        alias: 'order_status',
        type: 'string',
      },
    ])
  })

  test('should handle field type inference errors', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      if (params[0] === 'users') {
        return [
          [
            {
              Field: 'created_at',
              Type: 'datetime',
              Null: 'NO',
              Key: '',
              Default: 'CURRENT_TIMESTAMP',
              Extra: '',
              Comment: '创建时间',
            },
          ],
        ]
      }
      return [[]]
    }

    const sql = `
      SELECT
        (SELECT COUNT(*) FROM orders) + 'invalid' as test1,
        DATE_FORMAT(created_at, '%Y-%m-%d') + 1 as test2
      FROM users
    `
    const result = await parser.parse(sql)

    // 只验证基本属性
    const { fields } = result
    const simplifiedFields = fields.map(({ original, alias, type }) => ({ original, alias, type }))

    assert.deepEqual(simplifiedFields, [
      { original: "[object Object] + 'invalid'", alias: 'test1', type: 'string' },
      { original: "DATE_FORMAT(created_at, '%Y-%m-%d') + 1", alias: 'test2', type: 'string' },
    ])
  })

  test('should handle complex function expressions with errors', async ({ assert }) => {
    // Mock数据库查询
    Database.raw = async (sql, params) => {
      if (params[0] === 'users') {
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
              Field: 'first_name',
              Type: 'varchar(255)',
              Null: 'NO',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '名',
            },
            {
              Field: 'middle_name',
              Type: 'varchar(255)',
              Null: 'YES',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '中间名',
            },
            {
              Field: 'last_name',
              Type: 'varchar(255)',
              Null: 'NO',
              Key: '',
              Default: null,
              Extra: '',
              Comment: '姓',
            },
            {
              Field: 'status',
              Type: 'varchar(50)',
              Null: 'NO',
              Key: '',
              Default: 'active',
              Extra: '',
              Comment: '状态',
            },
          ],
        ]
      }
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

    // 只验证基本属性
    const { fields } = result
    const simplifiedFields = fields.map(({ original, alias, type }) => ({ original, alias, type }))

    assert.deepEqual(simplifiedFields, [
      { original: 'CUSTOM_FUNC(id, name)', alias: 'test1', type: 'string' },
      { original: 'UNKNOWN_FUNC(status)', alias: 'test2', type: 'string' },
      { original: "CONCAT(first_name, COALESCE(middle_name, ''), last_name)", alias: 'full_name', type: 'string' },
    ])
  })
})
