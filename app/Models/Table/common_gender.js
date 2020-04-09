const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class CommonGenderTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'common_gender',
      primary_key: 'gender_id',
    }
    super(data)
  }
}

module.exports = CommonGenderTable
