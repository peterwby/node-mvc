const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class RolesTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'roles',
      primary_key: 'role_id',
      fields: {
        role_id: {
          type: 'int',
          primary: true,
          auto_increment: true,
        },
        name: {
          type: 'string',
          length: 50,
          nullable: false,
          comment: '角色名称',
        },
        description: {
          type: 'string',
          length: 255,
          nullable: true,
          comment: '描述',
        },
        created_at: {
          type: 'datetime',
          nullable: true,
          default: 'CURRENT_TIMESTAMP',
        },
        updated_at: {
          type: 'datetime',
          nullable: true,
          default: 'CURRENT_TIMESTAMP',
          on_update: 'CURRENT_TIMESTAMP',
        },
      },
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
      let result = await Database.select('a.role_id', 'a.name', 'a.description', 'a.created_at', 'a.updated_at').from('roles as a').where('a.role_id', id)
      let data = result[0] || {}
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        data: { table: this.tableName },
        track: 'table_fetchDetailById_1586339053',
      })
    }
  }
}

module.exports = RolesTable
