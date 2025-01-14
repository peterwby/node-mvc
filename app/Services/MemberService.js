'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const log = use('Logger')
const MemberTable = require('@Table/member')
const memberTable = new MemberTable()
const Env = use('Env')
const Redis = use('Redis')

class Service extends BaseService {
  /**
   * 登录账号
   */
  async signIn(ctx) {
    try {
      let result = {}
      const { body } = ctx
      const { username, password } = body
      //匹配账号密码
      result = await memberTable.signIn({ username, password })
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

      //用于Views层的页面认证
      ctx.response.cookie('token', token, {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'lax',
      })
      let data = {
        token,
        member_info,
      }
      return Util.end({ data })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'signIn_jkh89hksdk3kj',
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
        member_status_id: item.member_status_id,
        member_status_name: item.member_status_name,
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
  async signUp(ctx) {
    try {
      let result = {}
      const { body } = ctx
      //检查账号是否已被占用
      result = await memberTable.checkExistByColumn({ username: body.username })
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
          username: body.username,
          nickname: body.nickname,
          password: await Hash.make(body.password),
        }
        result = await memberTable.create(trx, column)
        if (result.status === 0) {
          throw new Error('新增失败')
        }
      })

      result = await memberTable.signIn({ username: body.username, password: body.password })

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

      //用于Views层的页面认证
      ctx.response.cookie('token', token, {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'lax',
      })

      let data = {
        token,
        member_info,
      }
      return Util.end({ data })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_signUp_1586098916',
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
        password: body.old_pwd,
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
          set: { password: await Hash.make(body.new_pwd) },
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

  async getEditCommon(ctx) {
    try {
      let result = {}
      const { body } = ctx
      //common_gender
      const CommonGenderTable = require('@Table/common_gender')
      const commonGenderTable = new CommonGenderTable()
      result = await commonGenderTable.fetchAll()
      const gender_list = result.data.data.map((item) => ({
        gender_id: item.gender_id,
        gender_name: item.gender_name,
      }))
      //获取公共信息
      result = await memberTable.fetchDetailById(body.member_id)
      const common_info = result.data
      const data = {
        gender_list,
        common_info,
      }
      return Util.end({ data })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getEditCommon_1586338878',
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
          set: { nickname: body.nickname, email: body.email, cellphone: body.cellphone, remark: body.remark, gender_id: body.gender_id },
        })
        if (result.status === 0) {
          throw new Error('保存失败')
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

  async remove(ctx) {
    try {
      let result = {}
      const { body } = ctx
      await Database.transaction(async (trx) => {
        result = await memberTable.deleteByIds(trx, body.ids)
        if (result.status === 0) {
          throw new Error('删除失败')
        }
      })

      return Util.end({
        data: result.data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_remove_1586354645',
      })
    }
  }

  async getFuncInfo(ctx) {
    try {
      let result = {}
      const { body } = ctx
      let total_cache = await Redis.get('total_cache')
      let no_hit_cache = await Redis.get('no_hit_cache')
      let keys = await Redis.keys('count_/api/*')
      let keysList = keys.sort()
      let details = {}
      for (let item of keysList) {
        details[item] = await Redis.get(item)
      }
      const data = {
        total_cache,
        hit_cache: (parseInt(total_cache) - parseInt(no_hit_cache)).toString(),
        no_hit_cache,
        details,
      }
      return Util.end({ data })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getFuncInfo_1669936675',
      })
    }
  }

  async getFuncTime(ctx) {
    try {
      let result = {}
      const { body } = ctx
      let keys = await Redis.keys('time_/api/*')
      let keysList = keys.sort()
      let details = {}
      for (let item of keysList) {
        let content = (await Redis.get(item)) || ''
        details[item] = JSON.parse(content)
      }
      const data = {
        details,
      }
      return Util.end({ data })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getFuncTime_1670497267',
      })
    }
  }
}

module.exports = Service
