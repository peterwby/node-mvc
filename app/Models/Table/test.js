'use strict'

const Util = require('../../Lib/Util')
const BaseTable = require('../BaseTable')
const Database = use('Database')

/**
 * 测试表
 */
class TestTable extends BaseTable {
  /**
   * 是否存在姓名
   * @example
   * checkExistByName({
   *  userName: 'xx',
   * })
   * @returns object
   */
  async checkExistByName(obj) {
    try {
      const result = await Database.select('id')
        .from(this.tabelName)
        .where('user_name', obj.userName)

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
