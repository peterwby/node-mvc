const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class PrimaryMenusTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'primary_menus',
      primary_key: 'id',
    }
    super(data)
  }
}

module.exports = PrimaryMenusTable
