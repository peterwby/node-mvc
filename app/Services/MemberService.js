'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const log = use('Logger')
const MemberTable = require('@Table/member')
const memberTable = new MemberTable()
const Env = use('Env')

class Service extends BaseService {
  /**
   * 登录账号
   */
  async login(ctx) {
    try {
      let result = {}
      const { body } = ctx
      const { login_name, login_pwd } = body
      //匹配账号密码
      result = await memberTable.login({ login_name, login_pwd })
      if (result.status === 0) {
        //账号或密码不正确
        return Util.end({
          msg: result.msg,
          status: result.status,
        })
      }
      let member_info = Util.deepClone(result.data)

      //把账号相关信息存到session，并返回信息到前端
      ctx.session.put('member', member_info)
      //把sessionid存入token
      const jwt = require('jsonwebtoken')
      let secret = Env.get('JWT_SECRET')
      let sessionid = ctx.session.getSessionId()
      let token = jwt.sign(
        {
          sessionid: sessionid,
        },
        secret,
        { expiresIn: 3600 * 24 * 30 }
      ) //token有效期一个月
      let data = {
        token,
        member_info,
      }
      return Util.end({ data })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'login_jkh89hksdk3kj',
      })
    }
  }

  /**
   * 退出登录
   * @example
   *
   * @returns object
   */
  async logout(ctx) {
    try {
      ctx.session.clear()
      return Util.end({
        msg: '已退出系统',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'logout_313mbnvnjhdshj4f',
      })
    }
  }

  async getTableCommon(ctx) {
    try {
      let result = {}
      const { body } = ctx

      //状态下拉框
      const MemberStatusTable = require('@Table/member_status')
      const memberStatusTable = new MemberStatusTable()
      result = await memberStatusTable.fetchAll({
        orderBy: [['sequence', 'asc']],
      })
      const status_list = result.data.data.map((item) => ({
        status_id: item.status_id,
        status_name: item.status_name,
      }))
      //公共信息
      const common_info = {}

      const data = {
        status_list,
        common_info,
      }
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'getTableCommon_15814365260',
      })
    }
  }

  async getTable(ctx) {
    try {
      let result = {}
      const { body } = ctx
      //获取企业注册信息列表
      result = await memberTable.fetchListBy(body)
      return Util.end({
        data: result.data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'getTable_1581436968',
      })
    }
  }

  /**
   * 新增用户
   */
  async create(ctx) {
    try {
      let result = {}
      let data = {}
      const { body } = ctx
      //检查账号是否已被占用
      result = await memberTable.checkExistByColumn({ login_name: body.login_name })
      if (result.data.is_exist) {
        return Util.end({
          status: 0,
          msg: '此账号已被使用',
        })
      }
      //创建账号
      const Hash = use('Hash')
      await Database.transaction(async (trx) => {
        let column = {
          login_name: body.login_name,
          member_name: body.member_name,
          login_pwd: await Hash.make(body.login_pwd),
        }
        if (body.email) {
          column.email = body.email
        }
        if (body.cellphone) {
          column.cellphone = body.cellphone
        }
        result = await memberTable.create(trx, column)
        if (result.status === 0) {
          throw new Error('新增失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_create_1586098916',
      })
    }
  }

  /**
   * 修改密码
   * @example
   * editPassword({old_pwd, new_pwd})
   * @returns object
   */
  async editPassword(ctx) {
    try {
      let result = {}
      let column = {}
      const { body } = ctx
      //检查旧密码的正确性
      column = {
        member_id: body.member_id,
        login_pwd: body.old_pwd,
      }
      result = await memberTable.checkPwdValid(column)
      if (!result.data.is_valid) {
        return Util.end({
          msg: '旧密码不正确',
          status: 0,
        })
      }
      //重设新密码
      const Hash = use('Hash')
      await Database.transaction(async (trx) => {
        let data = {
          where: [['member_id', '=', body.member_id]],
          set: { login_pwd: await Hash.make(body.new_pwd) },
        }
        result = await memberTable.updateBy(trx, data)
        if (result.status === 0) {
          throw new Error('新密码修改失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'editPassword_989jiokl9j',
      })
    }
  }

  async edit(ctx) {
    try {
      let result = {}
      let column = {}
      const { body } = ctx

      await Database.transaction(async (trx) => {
        result = await memberTable.updateBy(trx, {
          where: [['member_id', '=', body.member_id]],
          set: { member_name: body.member_name },
        })
        if (result.status === 0) {
          throw new Error('编辑失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'edit_1581237428',
      })
    }
  }
}

module.exports = Service
