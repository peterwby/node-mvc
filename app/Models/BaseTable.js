'use strict'

const Util = require('../Lib/Util')
const Database = use('Database')

class BaseTable {
  constructor(tabelName) {
    this.tabelName = tabelName
  }

  /**
   * 通过主键id查询记录是否存在
   * @example
   * isExistById({
   *  id: 1,
   * }
   * @returns boolean
   */
  async isExistById(obj) {
    try {
      const result = await Database.select('id')
        .from(this.tabelName)
        .where('id', obj.id)

      return !!result[0]
    } catch (err) {
      log.error(err.message)
      return false
    }
  }

  /**
   * 创建一条记录
   * @example
   * create(trx,  {
   *  name: 'xx',
   *  status: 0
   * })
   * @returns object
   */
  async create(trx, obj) {
    try {
      let columns = Util.toLine(obj)
      const result = await trx.table(this.tabelName).insert(columns)
      return Util.end({
        msg: '创建成功',
        data: {
          newId: result[0],
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tabelName, req: obj },
        track: '9034jf938',
      })
    }
  }

  /**
   * 根据主键id更新一条记录
   * @example
   * updateById(trx, {
   *  id: 10,
   *  set: {
   *    status: 0
   *  }
   * })
   * @returns object
   */
  async updateById(trx, obj) {
    try {
      let columns = obj.set
      columns = Util.toLine(columns)
      const rows = await trx
        .table(this.tabelName)
        .where('id', obj.id)
        .update(columns)
      return Util.end({
        msg: '更新成功',
        data: { rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tabelName, req: obj },
        track: 'lkjg04590',
      })
    }
  }

  /**
   * 通过主键id数组，批量删除
   * @example
   * deleteBatchById(trx, {
   *  ids: [1,2,3]
   * })
   * @returns object
   */
  async deleteBatchById(trx, obj) {
    try {
      const rows = await trx
        .table(this.tabelName)
        .whereIn('id', obj.ids)
        .delete()
      return Util.end({
        msg: '删除成功',
        data: { rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tabelName, req: obj },
        track: 'h98h9h8',
      })
    }
  }

  /**
   * 通过主键id删除一条记录
   * @example
   * deleteById(trx, {
   *  id: 1
   * })
   * @returns object
   */
  async deleteById(trx, obj) {
    try {
      const rows = await trx
        .table(this.tabelName)
        .where('id', obj.id)
        .delete()
      return Util.end({
        msg: '删除成功',
        data: { rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tabelName, req: obj },
        track: 'ulkj4309',
      })
    }
  }

  /**
   * 通过主键id查询一条记录
   * @example
   * findById({
   *  id: 1,
   *  cols: ['name', 'status']
   * })
   * @returns object
   */
  async findById(obj) {
    try {
      let cols = obj.cols
      cols = Util.toLine(cols)
      const table = Database.clone()
      const result = await table
        .select(...cols)
        .from(this.tabelName)
        .where('id', obj.id)

      let data = Util.toCamel(result)
      return Util.end({
        data: data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tabelName, req: obj },
        track: '465u654',
      })
    }
  }

  /**
   * 无条件查询所有记录（limit 9999以防止查询太多）
   * @example
   * findAll({
   *  cols: ['name', 'status']
   * })
   * @returns object
   */
  async findAll(obj) {
    try {
      let cols = obj.cols
      cols = Util.toLine(cols)
      const table = Database.clone()
      const result = await table
        .select(...cols)
        .from(this.tabelName)
        .limit(9999)

      let data = Util.toCamel(result)
      return Util.end({
        data: data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tabelName, req: obj },
        track: '905j03j0',
      })
    }
  }
}

module.exports = BaseTable
