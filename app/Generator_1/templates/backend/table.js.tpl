'use strict'

const Database = use('Database')
const BaseTable = require('@BaseClass/BaseTable')
const Util = require('@Lib/Util')

class {{ class_name }}Table extends BaseTable {
  constructor() {
    const data = {
      table_name: '{{ table_name }}',
      primary_key: '{{ primary_key }}',
    }
    super(data)
  }

  /**
   * 获取列表
   * @param {Object} obj - 查询参数
   * @returns {Promise<Object>} 查询结果
   */
  async fetchListBy(obj) {
    try {
      const table = Database.clone()
      table
        .select('*')
        .from(this.tableName)
        .orderBy('{{ primary_key }}', 'desc')

      // 处理搜索条件
      if (obj.search) {
        table.where(function() {
          {{ search_conditions }}
        })
      }

      // 处理排序
      if (obj.sortField && obj.sortOrder) {
        table.orderBy(obj.sortField, obj.sortOrder)
      }

      const result = await table.paginate(obj.page || 1, obj.limit || 10)
      return Util.end({
        data: result,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'table_fetchListBy_{{ timestamp }}',
      })
    }
  }

}

module.exports = {{ class_name }}Table
