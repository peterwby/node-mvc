'use strict'

const Database = use('Database')
const Redis = use('Redis')
const Request = require('@Lib/Request')
const Util = require('@Lib/Util')
const BaseService = require('@BaseClass/BaseService')
const log = use('Logger')
const UsersTable = require('@Table/users')
const usersTable = new UsersTable()

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
      return Util.error({
        msg: err.message,
        track: 'service_jsBasics_1704612831862',
      })
    }
  }

  /**
   * 数据库查询示例
   */
  async dbSelect(params) {
    try {
      // 1. 基础查询
      const users = await Database.select('*').from('users').limit(10)

      // 2. 多条件查询
      const recentUsers = await Database.select(['id', 'username', 'created_at'])
        .from('users')
        .where('created_at', '>', Database.raw('DATE_SUB(NOW(), INTERVAL 7 DAY)'))
        .orderBy('created_at', 'desc')

      // 3. 模糊查询
      const searchUsers = await Database.select('*').from('users').where('username', 'like', '%test%')

      // 4. IN 查询
      const userIds = [1, 2, 3]
      const specificUsers = await Database.select('*').from('users').whereIn('id', userIds)

      // 5. 时间范围查询
      const timeRangeUsers = await Database.select('*')
        .from('users')
        .whereBetween('created_at', [Database.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'), Database.raw('NOW()')])

      // 6. 分组统计
      const userStats = await Database.select(Database.raw('DATE(created_at) as date'))
        .count('* as user_count')
        .from('users')
        .groupBy('date')
        .orderBy('date', 'desc')
        .limit(7)

      return {
        basicQuery: users,
        recentUsers,
        searchUsers,
        specificUsers,
        timeRangeUsers,
        userStats,
      }
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_dbSelect_1704612831862',
      })
    }
  }

  /**
   * 数据库增删改示例
   */
  async dbModify(params) {
    try {
      let result = {}

      // 1. 插入单条数据
      await Database.transaction(async (trx) => {
        result = await usersTable.create(trx, {
          username: 'test_user',
          created_at: new Date(),
          updated_at: new Date(),
          created_time: new Date(),
          updated_time: new Date(),
        })
        if (result.status === 0) {
          throw new Error('usersTable.create失败')
        }
      })

      // 2. 批量插入数据
      await Database.transaction(async (trx) => {
        result = await usersTable.createMany(trx, [
          {
            username: 'test_user1',
            created_at: new Date(),
            updated_at: new Date(),
            created_time: new Date(),
            updated_time: new Date(),
          },
          {
            username: 'test_user2',
            created_at: new Date(),
            updated_at: new Date(),
            created_time: new Date(),
            updated_time: new Date(),
          },
        ])
        if (result.status === 0) {
          throw new Error('usersTable.createMany失败')
        }
      })

      // 3. 更新数据
      await Database.transaction(async (trx) => {
        result = await usersTable.updateBy(trx, {
          where: [['id', '=', result.data.id]],
          set: {
            username: 'updated_user',
            updated_at: new Date(),
            updated_time: new Date(),
          },
        })
        if (result.status === 0) {
          throw new Error('usersTable.updateBy失败')
        }
      })

      // 4. 删除数据
      await Database.transaction(async (trx) => {
        result = await usersTable.deleteBy(trx, {
          where: [['created_at', '<', Database.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)')]],
        })
        if (result.status === 0) {
          throw new Error('usersTable.deleteBy失败')
        }
      })

      return result
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_dbModify_1704612831862',
      })
    }
  }

  /**
   * HTTP 请求示例
   */
  async httpRequest(params) {
    try {
      console.log('111')
      // 1. GET 请求：展示查询参数和重试配置
      const getResult = await Request.get(
        'http://127.0.0.1:3000/tutorial/js-basics',
        { page: 1, limit: 10, sort: 'desc' },
        {
          timeout: 1000,
          retries: 5,
          headers: {
            'Accept-Language': 'zh-CN',
          },
        }
      )
      console.log('222')

      // 2. POST 请求：展示请求体和完整配置
      const postResult = await Request.post(
        'http://127.0.0.1:3000/tutorial/js-basics',
        {
          username: 'test_user',
          email: 'test@example.com',
          type: 'example',
        },
        {
          timeout: 1000,
          retries: 2,
          headers: {
            'X-Custom-Header': 'test',
          },
          noload: true, // 不显示加载动画
        }
      )
      console.log('333')

      return {
        getResult: getResult.data,
        postResult: postResult.data,
      }
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_httpRequest_1704612831862',
      })
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
      return Util.error({
        msg: err.message,
        track: 'service_redisOps_1704612831862',
      })
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
      return Util.error({
        msg: err.message,
        track: 'service_fileOps_1704612831862',
      })
    }
  }
}

module.exports = TutorialService
