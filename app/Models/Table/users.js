const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class UsersTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'users',
      primary_key: 'id',
    }
    super(data)
  }
}

module.exports = UsersTable
