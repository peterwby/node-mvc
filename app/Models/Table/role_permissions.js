const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class RolePermissionsTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'role_permissions',
      primary_key: 'id',
      fields: {
        id: {
          type: 'int',
          primary: true,
          auto_increment: true,
        },
        role_id: {
          type: 'int',
          nullable: false,
          unique_group: 'uk_role_permission', // 联合唯一索引
        },
        permission_id: {
          type: 'int',
          nullable: false,
          unique_group: 'uk_role_permission', // 联合唯一索引
        },
      },
    }
    super(data)
  }
}

module.exports = RolePermissionsTable
