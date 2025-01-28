'use strict'

const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class {{ class_name }} extends BaseTable {
  constructor() {
    const data = {
      table_name: '{{ table_name }}',
      primary_key: '{{ primary_key }}',
    }
    super(data)
  }

  /**
   * 获取关联信息
   * @example
   * fetchDetailById(id)
   */
  async fetchDetailById(id) {
    try {
      let result = await Database.select({{ detail_fields }})
        .from('{{ table_name }} as a')
        {{ join_statements }}
        .where('a.{{ primary_key }}', id)
      let data = result[0] || {}
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        data: { table: this.tableName },
        track: 'table_fetchDetailById_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 列表信息
   * @example
   * fetchListBy({ search, page, limit })
   */
  async fetchListBy(obj) {
    try {
      let result = {}
      const table = Database.clone()
      table
        .select({{ list_fields }})
        .from('{{ table_name }} as a')
        {{ join_statements }}
        .orderBy('a.{{ primary_key }}', 'desc')

      {{ search_conditions }}

      result = await table.paginate(obj.page, obj.limit)
      return Util.end({
        data: result,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'table_fetchListBy_' + Util.genRandomString(),
      })
    }
  }

  {{ additional_methods }}
}

module.exports = {{ class_name }}
