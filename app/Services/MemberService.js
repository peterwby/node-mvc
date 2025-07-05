'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const FileUtil = require('@Lib/FileUtil')
const Helpers = use('Helpers')
const log = use('Logger')
const MemberTable = require('@Table/member')
const memberTable = new MemberTable()
const Env = use('Env')
const Redis = use('Redis')
const RolePermissionTable = require('@Table/role_permissions')
const rolePermissionTable = new RolePermissionTable()
const PermissionTable = require('@Table/permissions')
const permissionTable = new PermissionTable()
const MemberRoleTable = require('@Table/member_roles')
const memberRoleTable = new MemberRoleTable()

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

      // 获取用户权限
      let permissions = {}

      // 1. 获取用户的角色ID
      result = await memberRoleTable.fetchAll({
        where: [['member_id', '=', member_info.member_id]],
      })
      if (result.status === 1 && result.data.data.length > 0) {
        const roleIds = result.data.data.map((item) => item.role_id)
        // 2. 获取用户的角色权限
        result = await rolePermissionTable.fetchAll({
          where: [['role_id', 'in', roleIds]],
        })
        if (result.status === 1 && result.data.data.length > 0) {
          // 3. 获取权限详情
          const permissionIds = result.data.data.map((item) => item.permission_id)
          result = await permissionTable.fetchAll({
            where: [['permission_id', 'in', permissionIds]],
          })
          if (result.status === 1 && result.data.data.length > 0) {
            // 4. 转换为 permissions 对象 { 'permission_key': true }
            result.data.data.forEach((item) => {
              permissions[item.key] = true
            })
          }
        }
      }

      // 5. 存入 session（无论是否获取成功，都存入 permissions 对象）
      ctx.session.put('permissions', permissions)

      //把账号相关信息存到session，并返回信息到前端
      ctx.session.put('member', member_info)
      //把sessionid存入token
      const jwt = require('jsonwebtoken')
      let secret = Env.get('JWT_SECRET')
      let sessionid = await ctx.session.getSessionId()
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
        //secure: true,
        path: '/',
        //sameSite: 'lax',
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

  async list(ctx) {
    try {
      let result = {}
      const { body } = ctx

      //状态下拉框
      const DictMemberStatusTable = require('@Table/dict_member_status')
      const dictMemberStatusTable = new DictMemberStatusTable()
      result = await dictMemberStatusTable.fetchAll({
        orderBy: [['sequence', 'asc']],
      })
      const status_list = result.data.data.map((item) => ({
        member_status_id: item.member_status_id,
        member_status_name: item.member_status_name,
      }))

      const data = {
        status_list,
      }
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_list_1736864844',
      })
    }
  }

  /**
   * 获取列表
   */
  async getList(ctx) {
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
        track: 'getList_1581436968',
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
      let sessionid = await ctx.session.getSessionId()
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
   * updatePassword({old_pwd, new_pwd})
   * @returns object
   */
  async updatePassword(ctx) {
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
        track: 'updatePassword_989jiokl9j',
      })
    }
  }

  async updateInfo(ctx) {
    try {
      let result = {}
      let column = {}
      const { body } = ctx

      //如果有上传文件
      if (ctx.file) {
        console.log('开始处理上传的文件')
        const member_info = ctx.session.get('member')
        const filename = `file_${member_info.member_id}_${ctx.file.clientName}`
        const fileDir = Helpers.tmpPath('files')
        await FileUtil.checkAndPrepareFilePath(fileDir)
        await ctx.file.move(fileDir, {
          name: filename,
          overwrite: true,
        })
        if (!ctx.file.moved()) {
          console.log('文件上传失败')
        }
        console.log('上传 文件保存成功')
      }

      await Database.transaction(async (trx) => {
        result = await memberTable.updateBy(trx, {
          where: [['member_id', '=', body.member_id]],
          set: { nickname: body.nickname, email: body.email, member_status_id: body.member_status_id, remark: body.remark },
        })
        if (result.status === 0) {
          throw new Error('保存失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'updateInfo_1581237428',
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

  async create(ctx) {
    try {
      let result = {}
      const { body } = ctx

      //状态下拉框
      const DictMemberStatusTable = require('@Table/dict_member_status')
      const dictMemberStatusTable = new DictMemberStatusTable()
      result = await dictMemberStatusTable.fetchAll({
        orderBy: [['sequence', 'asc']],
      })
      const status_list = result.data.data.map((item) => ({
        member_status_id: item.member_status_id,
        member_status_name: item.member_status_name,
      }))

      const data = {
        status_list,
      }
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_create_1737635060',
      })
    }
  }

  /**
   * 获取会员详情
   */
  async view(ctx) {
    try {
      let result = {}
      const { body } = ctx
      const { member_id } = body

      //获取会员信息
      result = await memberTable.fetchOneById(member_id)
      if (!result.data) {
        return Util.end({
          status: 0,
          msg: '会员不存在',
        })
      }

      return Util.end({
        data: {
          member_info: result.data,
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_view_173763702235',
      })
    }
  }

  /**
   * 获取会员编辑信息
   */
  async edit(ctx) {
    try {
      let result = {}
      const { body } = ctx
      const { member_id } = body

      //状态下拉框
      const DictMemberStatusTable = require('@Table/dict_member_status')
      const dictMemberStatusTable = new DictMemberStatusTable()
      result = await dictMemberStatusTable.fetchAll({
        orderBy: [['sequence', 'asc']],
      })
      const status_list = result.data.data.map((item) => ({
        member_status_id: item.member_status_id,
        member_status_name: item.member_status_name,
      }))

      //获取会员信息
      result = await memberTable.fetchOneById(member_id)
      if (!result.data) {
        return Util.end({
          status: 0,
          msg: '会员不存在',
        })
      }
      const member_info = result.data

      return Util.end({
        data: {
          status_list,
          member_info,
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_edit_173763705235',
      })
    }
  }

  /**
   * 获取用户角色列表
   */
  async getRoles(ctx) {
    try {
      let result = {}
      const { body } = ctx
      const { id } = body

      // 获取所有角色
      const allRoles = await Database.table('roles').select('role_id', 'name', 'description').orderBy('role_id', 'asc')

      // 获取用户当前角色
      const userRoles = await Database.table('member_roles').where('member_id', id).pluck('role_id')

      // 标记用户已有的角色
      const roles = allRoles.map((role) => ({
        ...role,
        checked: userRoles.includes(role.role_id),
      }))

      return Util.end({
        data: roles,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_getRoles_1586096752',
      })
    }
  }

  /**
   * 保存用户角色配置
   */
  async saveRoles(ctx) {
    const trx = await Database.beginTransaction()
    try {
      const { body } = ctx
      const { id, role_ids } = body

      // 删除用户现有角色
      await Database.table('member_roles').where('member_id', id).transacting(trx).delete()

      // 添加新角色
      if (role_ids.length > 0) {
        const roleData = role_ids.map((role_id) => ({
          member_id: id,
          role_id,
        }))

        await Database.table('member_roles').transacting(trx).insert(roleData)
      }

      await trx.commit()

      return Util.end({
        msg: '保存成功',
      })
    } catch (err) {
      await trx.rollback()
      return Util.error({
        msg: err.message,
        track: 'service_saveRoles_1586096752',
      })
    }
  }

  async createInfo(ctx) {
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
      //检查通过，开始创建新记录
      await Database.transaction(async (trx) => {
        result = await memberTable.create(trx, body)
        if (result.status === 0) {
          throw new Error('新增失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_creat_1737637094',
      })
    }
  }
}

module.exports = Service
