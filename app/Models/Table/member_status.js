const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class MemberStatusTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'member_status',
      primary_key: 'member_status_id',
    }
    super(data)
  }
}

module.exports = MemberStatusTable
