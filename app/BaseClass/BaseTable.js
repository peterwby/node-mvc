'use strict'

const Util = require('@Lib/Util')
const log = use('Logger')
const Database = use('Database')

class BaseTable {
  constructor(obj = {}) {
    this.tableName = obj.table_name //表的名字，需跟数据库上的表名一模一样
    this.primaryKey = obj.primary_key || 'id' //表的主键，只支持单主键
  }

  /**
   * 通过主键id查询记录是否存在
   * @example
   * await checkExistById(id) //id=主键id值
   * @returns object
   */
  async checkExistById(id) {
    try {
      if (!id) throw new Error('请传入主键值')
      const result = await Database.select(this.primaryKey)
        .from(this.tableName)
        .where(this.primaryKey, id)

      return Util.end({
        data: {
          isExist: !!result[0],
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: {
          isExist: false,
        },
        track: '895893745',
      })
    }
  }

  /**
   * 插入一条记录
   * @example
   * await create(trx,  {
   *  name: 'xx',
   *  status: 0
   * })
   * @returns object
   */
  async create(trx, data) {
    try {
      const result = await trx.table(this.tableName).insert(data)
      return Util.end({
        msg: '新增成功',
        data: {
          newId: result[0],
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'hhjhfhf35',
      })
    }
  }

  /**
   * 批量插入记录
   * @example
   * await createMany(trx, [{'user_name':'chen'},{'user_name':'wu'}])
   * @returns object
   */
  async createMany(trx, data) {
    try {
      const result = await trx.batchInsert(this.tableName, data)
      return Util.end({
        msg: '批量新增成功',
        data: {
          newId: result[0],
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: '8907kll5asdf32',
      })
    }
  }

  /**
   * 根据条件更新数据
   * @example
   * updateBy(trx, {where:[['id','=',1]]})
   * @returns object
   */
  async updateBy(trx, obj) {
    try {
      if (!Util.isObj(obj)) throw new Error('请传入一个对象')
      const where = obj.where
      const set = obj.set
      if (!Util.isObj(set) || Util.isObjEmpty(set)) throw new Error('set必须是个对象')
      const table = Database.clone()
      table.from(this.tableName)
      if (Util.isArray(where) && where.length) {
        for (let item of where) {
          if (Util.isArray(item) && item.length >= 2) {
            table.where(...item)
          } else {
            throw new Error('where应该是个二维数组')
          }
        }
      }
      const affected_rows = await table.update(set).transacting(trx)

      return Util.end({
        msg: '已更新',
        data: { affected_rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: '43jsd342er4',
      })
    }
  }

  /**
   * 指定字段的值自增n
   * @example
   * updateAdd(trx, {
   *  add:['age', 1],
   *  where:[['status', '=', '1']]
   * })
   * @description
   * 如果字段值为null，则无效，必须为数字
   * @returns object
   */
  async updateAdd(trx, obj) {
    try {
      if (!Util.isObj(obj)) throw new Error('请传入一个object')
      const where = obj.where
      const add = obj.add
      if (!Util.isArray(add) || add.length !== 2) throw new Error('add不是合法数组')
      const table = Database.clone()
      table.from(this.tableName)
      if (Util.isArray(where) && where.length) {
        for (let item of where) {
          if (Util.isArray(item) && item.length >= 2) {
            table.where('id', '10')
          } else {
            throw new Error('where应该是个二维数组')
          }
        }
      }
      const result = await table.increment(add[0], add[1]).transacting(trx)
      const affected_rows = result
      return Util.end({
        data: { affected_rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: '9849s8dfs',
      })
    }
  }

  /**
   * 通过主键id数组，批量删除
   * @example
   * deleteByIds(trx, [1,2,3])
   * @returns object
   */
  async deleteByIds(trx, ids) {
    try {
      if (!Util.isArray(ids) || !ids.length) throw new Error('请传入主键的值')
      const affected_rows = await trx
        .table(this.tableName)
        .whereIn(this.primaryKey, ids)
        .delete()
      return Util.end({
        msg: '已删除',
        data: { affected_rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'h98aaah9h8',
      })
    }
  }

  /**
   * 根据条件删除数据
   * @example
   * deleteBy(trx, {where:[['id','=',1]]})
   * @returns object
   */
  async deleteBy(trx, obj) {
    try {
      if (!Util.isObj(obj)) throw new Error('请传入一个对象')
      const where = obj.where
      const table = Database.clone()
      table.from(this.tableName)
      if (Util.isArray(where) && where.length) {
        for (let item of where) {
          if (Util.isArray(item) && item.length >= 2) {
            table.where(...item)
          } else {
            throw new Error('where应该是个二维数组')
          }
        }
      }
      const affected_rows = await table.delete().transacting(trx)

      return Util.end({
        msg: '已删除',
        data: { affected_rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'k2jg034elflk',
      })
    }
  }

  /**
   * 通过主键id查询一条记录，返回的data是对象而不是数组
   * @example
   * fetchOneById(id)
   * @param id
   * 主键值
   * @returns object
   */
  async fetchOneById(id) {
    try {
      if (!id) throw new Error('请传入主键值')
      const result = await Database.select('*')
        .from(this.tableName)
        .where(this.primaryKey, id)
      let data = result[0] || {}
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: '3i4rf0fasd8',
      })
    }
  }

  /**
   * 根据条件查询，
   * @example
   * await fetchAll() //返回所有结果
   * 或
   * await fetchAll({ //按条件返回结果
   *  where:[['id', '>', '10'], ['status', '=', '1']],
   *  whereIn:['id', [1,2,3]],
   *  whereNotIn....,
   *  whereNull('status'),
   *  whereNotNull....,
   *  whereRaw('id = ?', [20]),
   *  column: ['user_name', 'age'],
   *  orderby: ['user_name', 'asc'],
   *  page: 1,
   *  limit: 10
   * })
   * @returns object
   */
  async fetchAll(obj = {}) {
    try {
      const column = obj.column
      const where = obj.where
      const whereIn = obj.whereIn
      const whereNotIn = obj.whereNotIn
      const whereNull = obj.whereNull
      const whereNotNull = obj.whereNotNull
      const whereRaw = obj.whereRaw
      const page = parseInt(obj.page || 1) //当前是第N页
      const limit = parseInt(obj.limit || 9999) //每页显示N行记录
      const orderBy = obj.orderBy

      const table = Database.clone()
      table.from(this.tableName)
      if (Util.isArray(column) && column.length && column[0] !== '*') {
        table.select(...column)
      } else {
        table.select('*')
      }
      if (Util.isArray(where) && where.length) {
        for (let item of where) {
          if (Util.isArray(item) && item.length >= 2) {
            table.where(...item)
          } else {
            throw new Error('where应该是个二维数组')
          }
        }
      }
      if (Util.isArray(whereIn) && whereIn.length === 2 && Util.isString(whereIn[0]) && Util.isArray(whereIn[1])) {
        table.whereIn(whereIn[0], whereIn[1])
      }
      if (Util.isArray(whereNotIn) && whereNotIn.length === 2 && Util.isString(whereNotIn[0]) && Util.isArray(whereNotIn[1])) {
        table.whereIn(whereNotIn[0], whereNotIn[1])
      }
      if (whereNull && Util.isString(whereNull)) {
        table.whereNull(whereNull)
      }
      if (whereNotNull && Util.isString(whereNotNull)) {
        table.whereNotNull(whereNotNull)
      }
      if (Util.isArray(whereRaw) && whereRaw.length === 2 && Util.isString(whereRaw[0]) && Util.isArray(whereRaw[1])) {
        table.whereRaw(whereRaw[0], whereRaw[1])
      }
      if (Util.isArray(orderBy) && orderBy.length === 2) {
        table.orderBy(...orderBy)
      }

      const result = await table.paginate(page, limit)
      return Util.end({
        data: result,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: '93404t9u89u9u9098jf',
      })
    }
  }

  /**
   * 获取总数量
   * @example
   * fetchCount(obj)
   * @param obj
   * 可选，空：无条件；对象{ where:[['status', '=', '1']] }：按条件
   * @returns object
   */
  async fetchCount(obj = null) {
    try {
      const table = Database.clone()
      table.from(this.tableName)
      if (Util.isObj(obj)) {
        const where = obj.where
        if (Util.isArray(where) && where.length) {
          for (let item of where) {
            if (Util.isArray(item) && item.length >= 2) {
              table.where(...item)
            } else {
              throw new Error('where应该是个二维数组')
            }
          }
        }
      }
      table.count('* as countValue')
      const result = await table

      let countValue = result[0].countValue || 0
      return Util.end({
        data: { countValue },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'affffkljkiii4a',
      })
    }
  }

  /**
   * 获取指定字段的最大值
   * @example
   * fetchMax({
   *  column: 'id'
   *  where:[['status', '=', '1']]
   * })
   * @returns object
   */
  async fetchMax(obj) {
    try {
      if (!Util.isObj(obj)) throw new Error('请传入一个object')
      const where = obj.where
      const column = obj.column.toString()
      if (!column) throw new Error('请传入一个字段名column')

      const table = Database.clone()
      table.from(this.tableName)
      if (Util.isArray(where) && where.length) {
        for (let item of where) {
          if (Util.isArray(item) && item.length >= 2) {
            table.where(...item)
          } else {
            throw new Error('where应该是个二维数组')
          }
        }
      }
      table.max(`${column} as maxValue`)
      const result = await table

      let maxValue = result[0].maxValue || 0
      return Util.end({
        data: { maxValue },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'ammkmfffsssfff3f',
      })
    }
  }

  /**
   * 获取指定字段的最小值
   * @example
   * fetchMin({
   *  column: 'id'
   *  where:[['status', '=', '1']]
   * })
   * @returns object
   */
  async fetchMin(obj) {
    try {
      if (!Util.isObj(obj)) throw new Error('请传入一个object')
      const where = obj.where
      const column = obj.column.toString()
      if (!column) throw new Error('请传入一个字段名column')

      const table = Database.clone()
      table.from(this.tableName)
      if (Util.isArray(where) && where.length) {
        for (let item of where) {
          if (Util.isArray(item) && item.length >= 2) {
            table.where(...item)
          } else {
            throw new Error('where应该是个二维数组')
          }
        }
      }
      table.min(`${column} as minValue`)
      const result = await table

      let minValue = result[0].minValue || 0
      return Util.end({
        data: { minValue },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'jkksssmmma55a59mmmmi',
      })
    }
  }

  /**
   * 获取指定字段的相加总和
   * @example
   * fetchSum({
   *  column: 'id'
   *  where:[['status', '=', '1']]
   * })
   * @returns object
   */
  async fetchSum(obj) {
    try {
      if (!Util.isObj(obj)) throw new Error('请传入一个object')
      const where = obj.where
      const column = obj.column.toString()
      if (!column) throw new Error('请传入一个字段名column')

      const table = Database.clone()
      table.from(this.tableName)
      if (Util.isArray(where) && where.length) {
        for (let item of where) {
          if (Util.isArray(item) && item.length >= 2) {
            table.where(...item)
          } else {
            throw new Error('where应该是个二维数组')
          }
        }
      }
      table.sum(`${column} as sumValue`)
      const result = await table

      let sumValue = result[0].sumValue || 0
      return Util.end({
        data: { sumValue },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: '43sfkl20hksdf9oljfs',
      })
    }
  }

  /**
   * 获取指定字段的平均数
   * @example
   * fetchAvg({
   *  column: 'id'
   *  where:[['status', '=', '1']]
   * })
   * @returns object
   */
  async fetchAvg(obj) {
    try {
      if (!Util.isObj(obj)) throw new Error('请传入一个object')
      const where = obj.where
      const column = obj.column.toString()
      if (!column) throw new Error('请传入一个字段名column')

      const table = Database.clone()
      table.from(this.tableName)
      if (Util.isArray(where) && where.length) {
        for (let item of where) {
          if (Util.isArray(item) && item.length >= 2) {
            table.where(...item)
          } else {
            throw new Error('where应该是个二维数组')
          }
        }
      }
      table.avg(`${column} as avgValue`)
      const result = await table

      let avgValue = result[0].avgValue || 0
      return Util.end({
        data: { avgValue },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: '9023gf9jfs',
      })
    }
  }
}

module.exports = BaseTable
