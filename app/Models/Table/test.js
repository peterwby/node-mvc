'use strict'

const Util = require('../../Lib/Util')
const BaseTable = require('../../BaseClass/BaseTable')
const Database = use('Database')

/**
 * 真实数据库中有一个表叫test，则Models/Table目录也建一个test.js文件，里面创建一个TestTable
 * 如果表名是users，则创建users.js，类名UsersTable
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
