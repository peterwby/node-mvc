const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class DictMemberStatusTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'dict_member_status',
      primary_key: 'member_status_id',
    }
    super(data)
  }
}

module.exports = DictMemberStatusTable
