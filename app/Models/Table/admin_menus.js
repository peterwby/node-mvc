const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class AdminMenusTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'admin_menus',
      primary_key: 'id',
    }
    super(data)
  }
}

module.exports = AdminMenusTable
