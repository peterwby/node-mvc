const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class PermissionsTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'permissions',
      primary_key: 'permission_id',
      fields: {
        permission_id: {
          type: 'int',
          primary: true,
          auto_increment: true,
        },
        name: {
          type: 'string',
          length: 100,
          nullable: false,
          comment: '权限名称',
        },
        type: {
          type: 'enum',
          values: ['menu', 'element', 'api'],
          nullable: false,
          comment: '权限类型：菜单/元素/API',
        },
        key: {
          type: 'string',
          length: 255,
          nullable: false,
          unique: true,
          comment: '权限标识(URL路径)',
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
      let result = await Database.select('a.permission_id', 'a.name', 'a.key', 'a.type', 'a.description', 'a.created_at', 'a.updated_at')
        .from('permissions  as a')
        .where('a.permission_id', id)
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

module.exports = PermissionsTable
