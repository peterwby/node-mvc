const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class DictLanguagesTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'dict_languages',
      primary_key: 'id',
    }
    super(data)
  }
}

module.exports = DictLanguagesTable
