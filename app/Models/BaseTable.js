'use strict'

const Util = require('../Lib/Util')
const Database = use('Database')

/**
 * 基类表
 */
class BaseTable {
  constructor(tabelName) {
    this.tabelName = tabelName
  }

  /**
   * 通过主键id查询记录是否存在(返回boolean)
   *
   * isExistById({
   *            id: 1,
   *  })
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
   *
   * create(trx,  {
   *    name: 'xx',
   *    status: 0
   * })
   */
  async create(trx, obj) {
    try {
      let columns = Util.toLine(obj)
      const result = await trx.table(this.tabelName).insert(columns)
      return Util.success({
        msg: '创建成功',
        data: {
          newId: result[0],
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tabelName },
        track: '9034jf938',
      })
    }
  }

  /**
   * 查询主键id，更新一条记录
   *
   * updateById(trx, {
   *        id: 10,
   *        set: {
   *            status: 0
   *        }
   * })
   */
  async updateById(trx, obj) {
    try {
      let columns = obj.set
      columns = Util.toLine(columns)
      const rows = await trx
        .table(this.tabelName)
        .where('id', obj.id)
        .update(columns)
      return Util.success({
        msg: '更新成功',
        data: { rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tabelName },
        track: 'lkjg04590',
      })
    }
  }

  /**
   * 通过主键id数组，批量删除
   *
   *  deleteBatchById(trx, {
   *            ids: [1,2,3]
   * })
   */
  async deleteBatchById(trx, obj) {
    try {
      const rows = await trx
        .table(this.tabelName)
        .whereIn('id', obj.ids)
        .delete()
      return Util.success({
        msg: '删除成功',
        data: { rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tabelName },
        track: 'h98h9h8',
      })
    }
  }

  /**
   * 通过主键id删除一条记录
   *
   * deleteById(trx, {
   *            id: 1
   * })
   */
  async deleteById(trx, obj) {
    try {
      const rows = await trx
        .table(this.tabelName)
        .where('id', obj.id)
        .delete()
      return Util.success({
        msg: '删除成功',
        data: { rows },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tabelName },
        track: 'ulkj4309',
      })
    }
  }

  /**
   * 通过主键id查询一条记录
   *
   * findById({
   *            id: 1,
   *            cols: ['name', 'status']
   *  })
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
      return Util.success({
        data: data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tabelName },
        track: '465u654',
      })
    }
  }
}

module.exports = BaseTable
