'use strict'

const Util = require('../Lib/Util')
const log = use('Logger')
const Database = use('Database')

class BaseTable {
  constructor(tableName) {
    this.tableName = tableName
  }

  /**
   * 通过主键id查询记录是否存在
   * @example
   * await checkExistById({
   *  user_id: 1,
   * },'user_id')
   * @returns object
   */
  async checkExistById(obj, idName = 'id') {
    try {
      const result = await Database.select(idName)
        .from(this.tableName)
        .where(idName, obj[idName])

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
   * 创建一条记录
   * @example
   * await create(trx,  {
   *  name: 'xx',
   *  status: 0
   * })
   * @returns object
   */
  async create(trx, obj) {
    try {
      let columns = Util.toLine(obj)
      const result = await trx.table(this.tableName).insert(columns)
      return Util.end({
        msg: '新增成功',
        data: {
          newId: result[0],
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName, req: obj },
        track: 'hhjhfhf35',
      })
    }
  }

  /**
   * 根据主键id更新一条记录
   * @example
   * updateById(trx, {
   *  user_id: 10,
   *  set: {
   *    status: 0
   *  }
   * }, 'user_id')
   * @returns object
   */
  async updateById(trx, obj, idName = 'id') {
    try {
      let columns = Util.toLine(obj.set)
      const rows = await trx
        .table(this.tableName)
        .where(idName, obj[idName])
        .update(columns)
      return Util.end({
        msg: '更新成功',
        data: { rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName, req: obj },
        track: 'lkjfffg04590',
      })
    }
  }

  /**
   * 通过主键id数组，批量删除
   * @example
   * deleteBatchById(trx, {
   *  ids: [1,2,3]
   * }, 'user_id')
   * @returns object
   */
  async deleteBatchById(trx, obj, idName = 'id') {
    try {
      const rows = await trx
        .table(this.tableName)
        .whereIn(idName, obj.ids)
        .delete()
      return Util.end({
        msg: '删除成功',
        data: { rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName, req: obj },
        track: 'h98aaah9h8',
      })
    }
  }

  /**
   * 通过主键id删除一条记录
   * @example
   * deleteById(trx, {
   *  id: 1
   * }, 'id')
   * @returns object
   */
  async deleteById(trx, obj, idName = 'id') {
    try {
      const rows = await trx
        .table(this.tableName)
        .where(idName, obj[idName])
        .delete()
      return Util.end({
        msg: '删除成功',
        data: { rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName, req: obj },
        track: 'ff23f23f23fss',
      })
    }
  }

  /**
   * 通过主键id查询一条记录
   * @example
   * fetchById({
   *  user_id: 1,
   *  column: ['name', 'status']
   * },'user_id')
   * @returns object
   */
  //TODO:select的字段由自己决定，不要...column这种写法
  async fetchById(obj, idName = 'id') {
    try {
      let column = Util.toLine(obj.column)
      const table = Database.clone()
      const result = await table
        .select(...column)
        .from(this.tableName)
        .where(idName, obj[idName])

      let data = Util.toCamel(result)
      return Util.end({
        data: data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName, req: obj },
        track: '3i4rf0fasd8',
      })
    }
  }

  /**
   * 无条件查询所有记录（limit 9999以防止查询太多）
   * @example
   * fetchAll({
   *  column: ['name', 'status']
   * })
   * @returns object
   */
  async fetchAll(obj) {
    try {
      let column = Util.toLine(obj.column)
      const table = Database.clone()
      const result = await table
        .select(...column)
        .from(this.tableName)
        .limit(9999)

      let data = Util.toCamel(result)
      return Util.end({
        data: data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName, req: obj },
        track: '90sdfsd5j03j0',
      })
    }
  }
}

module.exports = BaseTable
