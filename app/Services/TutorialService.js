'use strict'

const Database = use('Database')
const Redis = use('Redis')
const Request = require('@Lib/Request')
const Util = require('@Lib/Util')
const BaseService = require('@BaseClass/BaseService')
const log = use('Logger')

class TutorialService extends BaseService {
  /**
   * JavaScript 基础语法示例
   */
  async jsBasics() {
    try {
      // 1. 数据类型和变量
      const numberVar = 42
      const stringVar = 'Hello'
      const booleanVar = true
      const nullVar = null
      const undefinedVar = undefined

      // 2. 数组操作
      const fruits = ['apple', 'banana', 'orange']
      fruits.push('grape') // 添加元素
      fruits.pop() // 删除最后一个元素
      const firstFruit = fruits[0] // 获取元素
      const fruitCount = fruits.length // 数组长度

      // 数组高级操作
      const numbers = [1, 2, 3, 4, 5]
      const doubled = numbers.map((n) => n * 2) // [2, 4, 6, 8, 10]
      const evenNumbers = numbers.filter((n) => n % 2 === 0) // [2, 4]
      const sum = numbers.reduce((acc, n) => acc + n, 0) // 15

      // 3. 对象操作
      const user = {
        name: 'John',
        age: 30,
        hobbies: ['reading', 'gaming'],
        address: {
          city: 'Shanghai',
          country: 'China',
        },
      }

      // 对象属性访问
      const userName = user.name // 点号访问
      const userAge = user['age'] // 方括号访问
      user.email = 'john@example.com' // 添加属性
      delete user.age // 删除属性

      // 4. 循环语句
      const loopResults = {
        forLoop: [],
        forOf: [],
        forEach: [],
        mapMethod: [],
      }

      // for 循环
      for (let i = 0; i < 3; i++) {
        loopResults.forLoop.push(i)
      }

      // for...of（用于数组、对象）
      for (let fruit of fruits) {
        loopResults.forOf.push(fruit)
      }

      // forEach
      fruits.forEach((fruit) => {
        loopResults.forEach.push(fruit)
      })

      // map方法
      const originalArray = [1, 2, 3]
      loopResults.mapMethod = originalArray.map((num) => ({
        original: num,
        doubled: num * 2,
        squared: num * num,
      }))

      // 5. 类型转换和比较
      const typeComparisons = {
        zeroEqualsEmptyString: 0 == '', // true
        zeroEqualsZeroString: 0 == '0', // true
        zeroStrictEqualsZeroString: 0 === '0', // false
        emptyStringAsBool: Boolean(''), // false
        zeroStringAsBool: Boolean('0'), // true
        zeroAsBool: Boolean(0), // false
        ifZeroString: '0' ? true : false, // true
        ifZero: 0 ? true : false, // false
        arrayEmptyAsBool: Boolean([]), // true
        objectEmptyAsBool: Boolean({}), // true
      }

      // 5. 条件语句
      const score = 85
      let grade
      if (score >= 90) {
        grade = 'A'
      } else if (score >= 80) {
        grade = 'B'
      } else {
        grade = 'C'
      }

      // 三元运算符
      const isAdult = user.age >= 18 ? 'Yes' : 'No'

      // switch 语句
      const day = 1
      let dayName
      switch (day) {
        case 1:
          dayName = 'Monday'
          break
        case 2:
          dayName = 'Tuesday'
          break
        default:
          dayName = 'Unknown'
      }

      return {
        dataTypes: {
          number: numberVar,
          string: stringVar,
          boolean: booleanVar,
          null: nullVar,
          undefined: undefinedVar,
        },
        arrayOperations: {
          fruits,
          firstFruit,
          fruitCount,
          arrayMethods: {
            doubled,
            evenNumbers,
            sum,
          },
        },
        objectOperations: {
          user,
          propertyAccess: {
            userName,
            userAge,
          },
        },
        loops: loopResults,
        typeComparisons,
        conditionals: {
          grade,
          isAdult,
          dayName,
        },
      }
    } catch (err) {
      throw err
    }
  }

  /**
   * 数据库查询示例
   */
  async dbSelect(params) {
    try {
      // 1. 基础查询
      const users = await Database.select('*').from('user').where('status', 1).limit(10)

      // 2. 多条件查询
      const orders = await Database.select(['id', 'order_no', 'user_id'])
        .from('order')
        .where('status', 1)
        .where('total_amount', '>', 100)
        .orderBy('created_at', 'desc')

      // 3. 模糊查询
      const products = await Database.select('*').from('product').where('name', 'like', '%手机%')

      // 4. IN 查询
      const memberIds = [1, 2, 3]
      const members = await Database.select('*').from('member').whereIn('member_id', memberIds)

      // 5. 联表查询
      const orderDetails = await Database.select('order.*', 'user.username').from('order').leftJoin('user', 'order.user_id', 'user.id').where('order.status', 1)

      // 6. 分组统计
      const orderStats = await Database.select('user_id')
        .count('* as order_count')
        .sum('total_amount as total_amount')
        .from('order')
        .groupBy('user_id')
        .having('order_count', '>', 5)

      return {
        basicQuery: users,
        multiConditionQuery: orders,
        likeQuery: products,
        inQuery: members,
        joinQuery: orderDetails,
        statsQuery: orderStats,
      }
    } catch (err) {
      throw err
    }
  }

  /**
   * 数据库增删改示例
   */
  async dbModify(params) {
    try {
      return await Database.transaction(async (trx) => {
        // 1. 插入单条数据
        const userId = await trx.table('user').insert({
          username: 'test_user',
          email: 'test@example.com',
          status: 1,
        })

        // 2. 批量插入数据
        await trx.table('user_log').insert([
          { user_id: userId, action: 'login', ip: '127.0.0.1' },
          { user_id: userId, action: 'update_profile', ip: '127.0.0.1' },
        ])

        // 3. 更新数据
        await trx
          .table('user')
          .where('id', userId)
          .update({
            last_login_time: Database.fn.now(),
            login_count: trx.raw('login_count + 1'),
          })

        // 4. 删除数据
        await trx.table('user_log').where('created_at', '<', Database.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)')).delete()

        return { userId }
      })
    } catch (err) {
      throw err
    }
  }

  /**
   * HTTP 请求示例
   */
  async httpRequest(params) {
    try {
      // 1. GET 请求
      const getResult = await Request.get('https://api.example.com/users', { page: 1, limit: 10 }, { timeout: 5000 })

      // 2. POST 请求
      const postResult = await Request.post(
        'https://api.example.com/users',
        {
          username: 'test_user',
          email: 'test@example.com',
        },
        { timeout: 5000 }
      )

      return {
        getResult: getResult.data,
        postResult: postResult.data,
      }
    } catch (err) {
      throw err
    }
  }

  /**
   * Redis 操作示例
   */
  async redisOps(params) {
    try {
      // 1. 设置字符串
      await Redis.set('user:1:name', 'John')

      // 2. 设置带过期时间的值（1小时）
      await Redis.set('user:1:token', 'abc123', 'EX', 3600)

      // 3. 获取值
      const userName = await Redis.get('user:1:name')
      const userToken = await Redis.get('user:1:token')

      // 4. 删除键
      await Redis.del('user:1:name')

      // 5. 批量操作
      await Redis.multi().set('user:2:name', 'Jane').set('user:2:age', '25').exec()

      // 6. 检查键是否存在
      const exists = await Redis.exists('user:2:name')

      // 7. 设置哈希表
      await Redis.hmset('user:3', {
        name: 'Tom',
        age: '30',
        city: 'Shanghai',
      })

      // 8. 获取哈希表
      const userInfo = await Redis.hgetall('user:3')

      return {
        stringOps: {
          userName,
          userToken,
        },
        exists,
        hashOps: userInfo,
      }
    } catch (err) {
      throw err
    }
  }

  /**
   * 文件操作示例
   */
  async fileOps(params) {
    try {
      const fs = require('fs')
      const path = require('path')

      // 1. 写入文件
      const filePath = path.join(__dirname, '../../tmp/test.txt')
      fs.writeFileSync(filePath, 'Hello World')

      // 2. 读取文件
      const content = fs.readFileSync(filePath, 'utf8')

      // 3. 检查文件是否存在
      const exists = fs.existsSync(filePath)

      // 4. 获取文件信息
      const stats = fs.statSync(filePath)

      return {
        content,
        exists,
        fileInfo: {
          size: stats.size,
          createTime: stats.birthtime,
          modifyTime: stats.mtime,
        },
      }
    } catch (err) {
      throw err
    }
  }
}

module.exports = TutorialService
