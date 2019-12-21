'use strict'

const Util = require('@Lib/Util')
const log = use('Logger')
const Database = use('Database')

class JoinTable {
  constructor() {}

  /**
   * 条件查询
   * @example
   * fetchTest3By({
   *  filter: {
   *    userName: 'wu',
   *    status: 1,
   *  }
   * })
   * @returns object
   */
  async fetchTest3By(obj) {
    try {
      let result = {}
      const filter = obj.filter
      let page = filter.page || 1 //当前是第N页
      let limit = filter.limit || 9999 //每页显示N行记录
      //生成一个db对象的拷贝
      const table = Database.clone()
      table
        //.select('*')
        .select('a.user_name', 'a.ctime', 'a.status', 'b.m_role_id as role_id', 'd.auth_name')
        .from('admin as a')
        .innerJoin('admin_role as b', 'a.id', 'b.m_admin_id')
        .leftJoin('role_auth as c', 'b.id', 'c.m_role_id')
        .leftJoin('auth as d', 'c.m_auth_id', 'd.id')
        .whereIn('a.status', [0, 1])
        .where('a.status', '<', 2)
      if (filter.fromdate && filter.todate) {
        table.whereBetween('a.ctime', [filter.fromdate, filter.todate])
      }
      if (filter.status) {
        table.where('a.status', filter.status)
      }
      if (filter.keyword) {
        table.where(`a.user_name`, `like`, `%${filter.keyword}%`).orWhere(`d.auth_name`, `like`, `%${filter.keyword}%`)
        //上面这样写，由于or优先级高，可能导致不想要的结果，复杂的语句可以用原生写法：
        //table.whereRaw(`(a.user_name=? or d.auth_name=?)`, [filter.keyword, filter.keyword])
      }
      table
        //.groupBy('a.user_name')
        .orderBy('a.ctime', 'desc')
        .distinct()
      //await关键字：在这里表示执行sql，paginate：把结果分页显示
      result = await table.paginate(page, limit)

      let data = result.data
      return Util.end({
        data: data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName, req: obj },
        track: '3049j09jf0',
      })
    }
  }
}

module.exports = JoinTable
