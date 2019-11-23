'use strict'

const Util = require('../Lib/Util')
const log = use('Logger')
const Database = use('Database')

class BaseTable {
  constructor(tabelName) {
    this.tabelName = tabelName
  }

  /**
   * 通过主键id查询记录是否存在
   * @example
   * await checkExistById({
   *  id: 1,
   * }
   * @returns object
   */
  async checkExistById(obj) {
    try {
      const result = await Database.select('id')
        .from(this.tabelName)
        .where('id', obj.id)

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
    } finally {
      await Database.close()
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
      const result = await trx.table(this.tabelName).insert(columns)
      return Util.end({
        msg: '新增成功',
        data: {
          newId: result[0],
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tabelName, req: obj },
        track: 'hhjhfhf35',
      })
    } finally {
      await Database.close()
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
      let columns = Util.toLine(obj.set)
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
        track: 'lkjfffg04590',
      })
    } finally {
      await Database.close()
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
        track: 'h98aaah9h8',
      })
    } finally {
      await Database.close()
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
        track: 'ff23f23f23fss',
      })
    } finally {
      await Database.close()
    }
  }

  /**
   * 通过主键id查询一条记录
   * @example
   * fetchById({
   *  id: 1,
   *  column: ['name', 'status']
   * })
   * @returns object
   */
  //TODO:select的字段由自己决定，不要...column这种写法
  async fetchById(obj) {
    try {
      let column = Util.toLine(obj.column)
      const table = Database.clone()
      const result = await table
        .select(...column)
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
        track: '3i4rf0fasd8',
      })
    } finally {
      await Database.close()
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
        track: '90sdfsd5j03j0',
      })
    } finally {
      await Database.close()
    }
  }
}

module.exports = BaseTable
