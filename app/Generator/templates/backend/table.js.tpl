'use strict'

const Database = use('Database')
const BaseTable = require('@BaseClass/BaseTable')
const Util = require('@Lib/Util')

class {{ class_name }}Table extends BaseTable {
  constructor() {
    const data = {
      table_name: '{{ table_name }}',
      primary_key: '{{ primary_key }}',
    }
    super(data)
  }
}

module.exports = {{ class_name }}Table
