'use strict'

const Util = require('../../Lib/Util')
const BaseTable = require('../BaseTable')
const Database = use('Database')

/**
 * 测试表
 */
class TestTable extends BaseTable {
  /**
   * 是否存在姓名(返回boolean)
   *
   * isExistByName({
   *            userName: 'x',
   *  })
   */
  async isExistByName(obj) {
    try {
      const result = await Database.select('id')
        .from(this.tabelName)
        .where('user_name', obj.userName)

      return !!result[0]
    } catch (err) {
      log.error(err.message)
      return false
    }
  }
}

module.exports = TestTable
