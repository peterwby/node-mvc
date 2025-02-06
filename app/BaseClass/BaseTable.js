'use strict'

const Util = require('@Lib/Util')
const Database = use('Database')

class BaseTable {
  constructor(obj = {}) {
    this.tableName = obj.table_name //表的名字，需跟数据库上的表名一模一样
    this.primaryKey = obj.primary_key || 'id' //表的主键，只支持单主键
    this.data = obj
  }

  /**
   * 验证数据
   * @param {Object} data - 要验证的数据对象，通常是前端提交的表单数据，如 { name: '管理员', description: '系统管理员' }
   * @param {Array} fields_to_validate - 需要验证的字段列表，如果为空则验证所有字段
   * @returns {Object} - Util.end
   */
  async validate(data, fields_to_validate = null) {
    try {
      // 如果没有定义 fields，直接返回成功
      if (!this.data.fields) {
        return Util.end({
          data: { is_valid: true },
        })
      }

      const errors = []
      const fields = fields_to_validate || Object.keys(this.data.fields)

      fields.forEach((field) => {
        // 跳过主键的验证
        if (field === this.primaryKey) {
          return
        }

        const field_def = this.data.fields[field]
        const value = data[field]

        // 如果字段定义不存在，跳过验证
        if (!field_def) {
          return
        }

        // 必填检查
        if (!field_def.nullable && (value === null || value === undefined || value === '')) {
          errors.push(`${field_def.comment || field}不能为空`)
          return
        }

        // 如果值为空且允许为空，跳过后续验证
        if (value === null || value === undefined || value === '') {
          return
        }

        // 类型检查
        switch (field_def.type) {
          case 'int':
            if (!Number.isInteger(Number(value))) {
              errors.push(`${field_def.comment || field}必须是整数`)
            }
            break

          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${field_def.comment || field}必须是字符串`)
            } else if (field_def.length && value.length > field_def.length) {
              errors.push(`${field_def.comment || field}长度不能超过${field_def.length}个字符`)
            }
            break

          case 'enum':
            if (field_def.values && !field_def.values.includes(value)) {
              errors.push(`${field_def.comment || field}的值必须是: ${field_def.values.join(', ')}`)
            }
            break

          case 'datetime':
            if (!(value instanceof Date) && isNaN(Date.parse(value))) {
              errors.push(`${field_def.comment || field}必须是有效的日期时间格式`)
            }
            break
        }
      })

      if (errors.length > 0) {
        return Util.end({
          data: { is_valid: false, status: 0, msg: errors.join('; ') },
        })
      }

      return Util.end({
        data: { is_valid: true },
      })
    } catch (err) {
      return Util.end({
        data: { is_valid: false, status: -1, msg: err.message },
      })
    }
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
      let result = await Database.select(this.primaryKey).from(this.tableName).where(this.primaryKey, id)

      return Util.end({
        data: {
          is_exist: !!result[0],
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_checkExistById_0293490244',
      })
    }
  }

  /**
   * 查询某个记录是否存在
   * @example
   * await checkExistByColumn({ columnName : xx })
   * @returns object
   */
  async checkExistByColumn(obj) {
    try {
      let arr = Object.entries(obj)[0]
      let result = await Database.select(this.primaryKey).from(this.tableName).where(arr[0], arr[1])

      return Util.end({
        data: {
          is_exist: !!result[0],
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_080329r3iffd',
      })
    }
  }

  /**
   * 插入一条记录（带验证）
   * @param {Object} trx - 事务对象
   * @param {Object} data - 要插入的数据
   * @param {Object} options - 选项，如 { skip_validation: true } 可跳过验证
   * @returns {Object} - Util.end 或 Util.error 格式的返回值
   */
  async create(trx, data, options = {}) {
    try {
      // 1. 数据验证（除非明确跳过）
      if (!options.skip_validation) {
        const validate_result = await this.validate(data)
        if (validate_result.status < 1) {
          return Util.end({
            msg: '新增失败: ' + validate_result.msg,
            status: 0,
            data: validate_result,
          })
        }
      }

      // 2. 执行插入
      let result = await trx.table(this.tableName).insert(data)
      if (result[0]) {
        return Util.end({
          msg: '新增成功',
          status: 1,
          data: {
            new_id: result[0],
          },
        })
      }
      return Util.end({
        msg: '新增失败',
        status: 0,
        data: {
          new_id: null,
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_hhjhfhf35',
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
      // 1. 基础参数验证
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('请传入非空数组')
      }

      // 2. 数据验证（除非明确跳过）
      if (!options.skip_validation) {
        for (let i = 0; i < data.length; i++) {
          const item = data[i]
          const validate_result = await this.validate(item)
          if (validate_result.status < 1) {
            return Util.end({
              msg: `第${i + 1}条数据验证失败: ${validate_result.msg}`,
              status: 0,
              data: validate_result,
            })
          }
        }
      }

      // 3. 执行批量插入
      let result = await trx.batchInsert(this.tableName, data)
      if (!result[0]) {
        return Util.end({
          msg: '批量新增失败',
          status: 0,
          data: {
            new_id: null,
          },
        })
      }
      return Util.end({
        msg: '批量新增成功',
        data: {
          new_id: result[0],
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_8907kll5asdf32',
      })
    }
  }

  /**
   * 更新记录（带验证）
   * @param {Object} trx - 事务对象
   * @param {Object} obj - 更新条件和数据
   * @param {Object} options - 选项，如 { skip_validation: true } 可跳过验证
   * @returns {Object} - Util.end 或 Util.error 格式的返回值
   */
  async updateBy(trx, obj, options = {}) {
    try {
      // 1. 数据验证（除非明确跳过）
      if (!options.skip_validation && obj.set) {
        const validate_result = await this.validate(obj.set, Object.keys(obj.set))
        if (validate_result.status < 1) {
          return Util.end({
            msg: '更新失败: ' + validate_result.msg,
            status: 0,
            data: validate_result,
          })
        }
      }

      // 2. 执行更新
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
      if (affected_rows > 0) {
        return Util.end({
          msg: '已更新',
          status: 1,
          data: { affected_rows },
        })
      }
      return Util.end({
        msg: '更新失败',
        status: 0,
        data: { affected_rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_43jsd342er4',
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
            table.where(...item)
          } else {
            throw new Error('where应该是个二维数组')
          }
        }
      }
      let result = await table.increment(add[0], add[1]).transacting(trx)
      const affected_rows = result
      if (affected_rows > 0) {
        return Util.end({
          msg: '已更新',
          status: 1,
          data: { affected_rows },
        })
      }
      return Util.end({
        msg: '更新失败',
        status: 0,
        data: { affected_rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_9849s8dfs',
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
      if (!Util.isArray(ids) || ids.length === 0) throw new Error('请传入主键的值')
      const affected_rows = await trx.table(this.tableName).whereIn(this.primaryKey, ids).delete()

      if (affected_rows > 0) {
        return Util.end({
          msg: '已删除',
          status: 1,
          data: { affected_rows },
        })
      }
      return Util.end({
        msg: '删除失败',
        status: 0,
        data: { affected_rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_h98aaah9h8',
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

      if (affected_rows > 0) {
        return Util.end({
          msg: '已删除',
          status: 1,
          data: { affected_rows },
        })
      }
      return Util.end({
        msg: '删除失败',
        status: 0,
        data: { affected_rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_k2jg034elflk',
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
      let result = await Database.select('*').from(this.tableName).where(this.primaryKey, id)
      let data = result[0] || {}
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_3i4rf0fasd8',
      })
    }
  }

  /**
   * 根据条件查询，
   * @example
   * await fetchAll() //返回所有结果
   * 或
   * await fetchAll({ //按条件返回结果
   *  column: ['user_name', 'age'],
   *  where:[['id', '>', '10'], ['status', '=', '1']],
   *  whereIn:['id', [1,2,3]],
   *  whereNotIn....,
   *  whereNull:['status'],
   *  whereNotNull....,
   *  whereRaw:['id = ?', [20]],
   *  orderBy: [['user_name', 'asc']],
   *  page: 1,
   *  limit: 10
   * })
   * @returns object
   */
  async fetchAll(obj = {}) {
    try {
      const { column, where, whereIn, whereNotIn, whereNull, whereNotNull, whereRaw, orderBy } = obj
      const page = parseInt(obj.page || 1) //当前是第N页
      const limit = parseInt(obj.limit || 9999) //每页显示N行记录

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
        table.whereNotIn(whereNotIn[0], whereNotIn[1])
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
      if (Util.isArray(orderBy) && orderBy.length) {
        for (let item of orderBy) {
          if (Util.isArray(item) && item.length === 2) {
            table.orderBy(...item)
          } else {
            throw new Error('orderBy应该是个二维数组')
          }
        }
      }

      let result = await table.paginate(page, limit)
      return Util.end({
        data: result,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_93404t9u89u9u9098jf',
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
      table.count('* as count_value')
      let result = await table

      let count_value = result[0].count_value || 0
      return Util.end({
        data: { count_value },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_affffkljkiii4a',
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
      table.max(`${column} as max_value`)
      let result = await table

      let max_value = result[0].max_value || 0
      return Util.end({
        data: { max_value },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_2kmfffsssfff3f',
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
      table.min(`${column} as min_value`)
      let result = await table

      let min_value = result[0].min_value || 0
      return Util.end({
        data: { min_value },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_mma55a59mmmmi',
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
      table.sum(`${column} as sum_value`)
      let result = await table

      let sum_value = result[0].sum_value || 0
      return Util.end({
        data: { sum_value },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_0hksdf9oljfs',
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
      table.avg(`${column} as avg_value`)
      let result = await table

      let avg_value = result[0].avg_value || 0
      return Util.end({
        data: { avg_value },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'BaseTable_9023gf9jfs',
      })
    }
  }
}

module.exports = BaseTable
