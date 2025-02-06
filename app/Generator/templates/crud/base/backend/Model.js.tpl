'use strict'

const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class ${table_name | pascal}Table extends BaseTable {
  constructor() {
    const data = {
      table_name: '${table_name}',
      primary_key: '${primary_key}'
    }
    super(data)
  }

  /**
   * 根据ID获取详情
   */
  async fetchDetailById(id) {
    try {
      const result = await Database.select('*')
        .table(this.tableName)
        .where(this.primaryKey, id)
        .first()

      if (!result) {
        return Util.end({
          msg: '记录不存在',
          status: 0
        })
      }

      return Util.end({
        data: result
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'fetchDetailById_${timestamp}'
      })
    }
  }

  /**
   * 获取列表数据
   */
  async fetchListBy(obj) {
    try {
      let result = {}
      const table = Database.clone()
      table.select('*').from(this.tableName)

      result = await table.paginate(obj.page, obj.limit)
      return Util.end({
        data: result,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'fetchListBy_${timestamp}'
      })
    }
  }

}

module.exports = ${table_name | pascal}Table
