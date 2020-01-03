'use strict'

const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')
const Database = use('Database')

/**
 * 真实数据库中有一个表叫test，则Models/Table目录也建一个test.js文件，里面创建一个TestTable
 * 如果表名是user_order，则创建user_order.js，类名UserOrderTable
 */
class TestTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'test',
      primary_key: 'id',
    }
    super(data)
  }
  /**
   * 是否存在姓名
   * @example
   * checkExistByName({
   *  user_name: 'xx',
   * })
   * @returns object
   */
  async checkExistByName(obj) {
    try {
      const result = await Database.select('id')
        .from(this.tableName)
        .where('user_name', obj.user_name)

      return Util.end({
        data: {
          isExist: !!result[0],
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: {
          isExist: false,
        },
        track: 'joipo090',
      })
    }
  }
}

module.exports = TestTable
