const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')
const Hash = use('Hash')

class MemberTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'member',
      primary_key: 'member_id',
    }
    super(data)
  }

  /**
   * 检查密码是否正确
   * @example
   * checkPwdValid({username, password})
   * @returns object
   */
  async checkPwdValid(obj) {
    try {
      let result = {}
      let is_valid = false
      result = await Database.select('password').table(this.tableName).where('username', obj.username)
      //匹配到账号
      if (result[0]) {
        let isPwdSame = await Hash.verify(obj.password, result[0].password)
        //密码匹配
        if (isPwdSame) {
          is_valid = true
        } else {
          is_valid = false
        }
      }

      return Util.end({
        data: {
          is_valid,
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'checkPwdValid_9u4sdf4r9df9yh9j24',
      })
    }
  }
  /**
   * 登录
   * @example
   * signIn({username, password})
   * @returns object
   */
  async signIn(obj) {
    try {
      const { username, password } = obj
      let result = {}
      let msg = ''
      let data = {}
      let status = 0

      result = await Database.select('member_id', 'nickname', 'password', 'email')
        .table(this.tableName)
        .where('username', username)
        .where('member_status_id', 1)
      //匹配到账号
      if (result[0]) {
        let isPwdSame = await Hash.verify(password, result[0].password)
        //密码匹配
        if (isPwdSame) {
          data = {
            username,
            member_id: result[0].member_id,
            nickname: result[0].nickname,
            email: result[0].email,
          }
          msg = '已登录'
          status = 1
        } else {
          msg = '密码错误'
          status = 0
        }
      } else {
        msg = '该账号还未注册，或已被禁用'
        status = 0
      }
      return Util.end({
        msg,
        status,
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'table_signIn_1586100114',
      })
    }
  }

  /**
   * 获取关联信息
   * @example
   * fetchDetailById(id)
   */
  async fetchDetailById(id) {
    try {
      let result = await Database.select(
        'a.username',
        'a.nickname',
        'a.email',
        'a.cellphone',
        'a.gender_id',
        'a.ctime',
        'a.member_status_id',
        'b.member_status_name',
        'a.remark'
      )
        .from('member as a')
        .innerJoin('dict_member_status as b', 'a.member_status_id', 'b.member_status_id')
        .where('a.member_id', id)
      let data = result[0] || {}
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        data: { table: this.tableName },
        track: 'table_fetchDetailById_1586339053',
      })
    }
  }

  /**
   * 列表信息
   * @example
   * fetchListBy({ status_id, search, page, limit })
   */
  async fetchListBy(obj) {
    try {
      let result = {}
      const table = Database.clone()
      table
        .select('a.member_id', 'a.nickname', 'a.username', 'a.email', 'a.created_at', 'a.member_status_id', 'b.member_status_name')
        .from('member as a')
        .innerJoin('dict_member_status as b', 'a.member_status_id', 'b.member_status_id')
        .orderBy('a.member_id', 'desc')
      if (obj.member_status_id) {
        table.where('a.member_status_id', '=', obj.member_status_id)
      }
      if (obj.search) {
        table.where(function () {
          this.where('a.nickname', 'like', `%${obj.search}%`).orWhere('a.username', 'like', `%${obj.search}%`)
        })
      }
      result = await table.paginate(obj.page, obj.limit)
      return Util.end({
        data: result,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'fetchListBy_1581552671',
      })
    }
  }
}

module.exports = MemberTable
