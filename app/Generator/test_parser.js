/**
 * 测试表名提取功能
 */
function testTableExtraction() {
  // 从表定义中提取表名和别名
  function extractTableAndAlias(tableDef) {
    if (!tableDef) return null

    tableDef = tableDef.trim()

    // 1. 处理 AS 别名
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

  // 提取表名
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
      if (joinParts[i + 1]) {
        const tablePart = joinParts[i + 1].split(/\bon\b/i)[0].trim()
        const joinedTable = extractTableAndAlias(tablePart)
        if (joinedTable) {
          tables.push(joinedTable)
        }
      }
    }

    return tables
  }

  const testCases = [
    {
      name: '简单查询',
      sql: 'SELECT * FROM users',
      expected: [{ name: 'users', alias: 'users' }],
    },
    {
      name: '使用 AS 别名',
      sql: 'SELECT * FROM users AS u',
      expected: [{ name: 'users', alias: 'u' }],
    },
    {
      name: '使用空格别名',
      sql: 'SELECT * FROM users u',
      expected: [{ name: 'users', alias: 'u' }],
    },
    {
      name: '带 WHERE 子句',
      sql: 'SELECT id, name FROM users WHERE status = 1',
      expected: [{ name: 'users', alias: 'users' }],
    },
    {
      name: '带 GROUP BY 子句',
      sql: 'SELECT id, name FROM users GROUP BY id',
      expected: [{ name: 'users', alias: 'users' }],
    },
    {
      name: '带 ORDER BY 子句',
      sql: 'SELECT id, name FROM users ORDER BY id',
      expected: [{ name: 'users', alias: 'users' }],
    },
    {
      name: '带 LIMIT 子句',
      sql: 'SELECT id, name FROM users LIMIT 10',
      expected: [{ name: 'users', alias: 'users' }],
    },
    {
      name: 'INNER JOIN',
      sql: 'SELECT * FROM users AS u INNER JOIN orders AS o ON u.id = o.user_id',
      expected: [
        { name: 'users', alias: 'u' },
        { name: 'orders', alias: 'o' },
      ],
    },
    {
      name: 'LEFT JOIN',
      sql: 'SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id',
      expected: [
        { name: 'users', alias: 'u' },
        { name: 'orders', alias: 'o' },
      ],
    },
    {
      name: 'RIGHT JOIN',
      sql: 'SELECT * FROM users RIGHT JOIN orders ON users.id = orders.user_id',
      expected: [
        { name: 'users', alias: 'users' },
        { name: 'orders', alias: 'orders' },
      ],
    },
    {
      name: '多表 JOIN',
      sql: `
        SELECT * FROM users u
        INNER JOIN orders o ON u.id = o.user_id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        RIGHT JOIN products p ON oi.product_id = p.id
      `,
      expected: [
        { name: 'users', alias: 'u' },
        { name: 'orders', alias: 'o' },
        { name: 'order_items', alias: 'oi' },
        { name: 'products', alias: 'p' },
      ],
    },
    {
      name: '带数据库名的表',
      sql: 'SELECT * FROM mydb.users u JOIN mydb.orders o ON u.id = o.user_id',
      expected: [
        { name: 'mydb.users', alias: 'u' },
        { name: 'mydb.orders', alias: 'o' },
      ],
    },
    {
      name: '子查询作为表',
      sql: `
        SELECT * FROM (
          SELECT id, name FROM users WHERE status = 1
        ) active_users
      `,
      expected: [{ name: '(SELECT id, name FROM users WHERE status = 1)', alias: 'active_users' }],
    },
    {
      name: '复杂子查询',
      sql: `
        SELECT * FROM users u
        JOIN (
          SELECT user_id, COUNT(*) as order_count
          FROM orders
          GROUP BY user_id
        ) user_orders ON u.id = user_orders.user_id
      `,
      expected: [
        { name: 'users', alias: 'u' },
        {
          name: '(SELECT user_id, COUNT(*) as order_count FROM orders GROUP BY user_id)',
          alias: 'user_orders',
        },
      ],
    },
  ]

  console.log('开始测试表名提取功能...')
  let passed = 0
  let failed = 0

  for (const testCase of testCases) {
    try {
      const result = extractTableNames(testCase.sql)
      const isEqual = JSON.stringify(result) === JSON.stringify(testCase.expected)

      console.log('\n测试用例:', testCase.name)
      console.log('SQL:', testCase.sql)
      if (isEqual) {
        console.log('✅ 通过')
        passed++
      } else {
        console.log('❌ 失败')
        console.log('期望结果:', JSON.stringify(testCase.expected))
        console.log('实际结果:', JSON.stringify(result))
        failed++
      }
    } catch (err) {
      console.log('\n测试用例:', testCase.name)
      console.log('SQL:', testCase.sql)
      console.log('❌ 错误:', err.message)
      failed++
    }
  }

  console.log('\n测试结果统计:')
  console.log(`总计: ${testCases.length}`)
  console.log(`通过: ${passed}`)
  console.log(`失败: ${failed}`)
}

// 运行测试
testTableExtraction()
