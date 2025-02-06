const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class MemberRolesTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'member_roles',
      primary_key: 'id',
      fields: {
        id: {
          type: 'int',
          primary: true,
          auto_increment: true,
        },
        member_id: {
          type: 'int',
          nullable: false,
          unique_group: 'uk_member_role', // 联合唯一索引
        },
        role_id: {
          type: 'int',
          nullable: false,
          unique_group: 'uk_member_role', // 联合唯一索引
        },
      },
    }
    super(data)
  }
}

module.exports = MemberRolesTable
