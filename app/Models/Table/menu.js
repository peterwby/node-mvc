const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class MenuTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'menu',
      primary_key: 'id',
    }
    super(data)
  }
}

module.exports = MenuTable
