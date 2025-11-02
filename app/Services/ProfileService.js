'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const Helpers = use('Helpers')
const MemberTable = require('@Table/member')
const memberTable = new MemberTable()
const FileUtil = require('@Lib/FileUtil')
const Hash = use('Hash')

class ProfileService extends BaseService {
  /**
   * 获取个人信息
   */
  async getProfile(ctx) {
    try {
      const member_info = ctx.session.get('member')
      if (!member_info || !member_info.member_id) {
        return Util.end({
          status: 0,
          msg: '用户信息不存在',
        })
      }

      // 从数据库获取完整信息
      const result = await memberTable.fetchDetailById(member_info.member_id)
      if (result.status > 0 && result.data) {
        return Util.end({
          data: result.data,
        })
      }
      return Util.end({
        status: 0,
        msg: '获取用户信息失败',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getProfile_1739012356882',
      })
    }
  }

  /**
   * 更新个人信息
   */
  async updateProfile(ctx) {
    try {
      const member_info = ctx.session.get('member')
      if (!member_info || !member_info.member_id) {
        return Util.end({
          status: 0,
          msg: '用户信息不存在',
        })
      }

      const { body } = ctx
      const updateData = {}

      if (body.nickname !== undefined) {
        updateData.nickname = body.nickname
      }
      if (body.email !== undefined) {
        updateData.email = body.email
      }
      if (body.remark !== undefined) {
        updateData.remark = body.remark
      }

      await Database.transaction(async (trx) => {
        const result = await memberTable.updateBy(trx, {
          where: [['member_id', '=', member_info.member_id]],
          set: updateData,
        })
        if (result.status === 0) {
          throw new Error(result.msg || '更新失败')
        }
      })

      // 更新session中的信息
      const updatedResult = await memberTable.fetchDetailById(member_info.member_id)
      if (updatedResult.status > 0 && updatedResult.data) {
        const updatedMember = Util.deepClone(updatedResult.data)
        updatedMember.member_id = Util.encode(updatedMember.member_id)
        ctx.session.put('member', updatedMember)
      }

      return Util.end({
        msg: '更新成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_updateProfile_1739012356882',
      })
    }
  }

  /**
   * 更新头像
   */
  async updateAvatar(ctx) {
    try {
      const member_info = ctx.session.get('member')
      if (!member_info || !member_info.member_id) {
        return Util.end({
          status: 0,
          msg: '用户信息不存在',
        })
      }

      if (!ctx.file) {
        return Util.end({
          status: 0,
          msg: '请上传头像图片',
        })
      }

      // 保存头像文件
      const file_name = `avatar_${member_info.member_id}_${Date.now()}.${ctx.file.subtype}`
      await ctx.file.move(Helpers.publicPath('upload/images'), {
        name: file_name,
        overwrite: true,
      })

      if (!ctx.file.moved()) {
        throw new Error('头像上传失败')
      }

      const avatar_path = `/upload/images/${file_name}`

      // 更新数据库
      await Database.transaction(async (trx) => {
        const result = await memberTable.updateBy(trx, {
          where: [['member_id', '=', member_info.member_id]],
          set: { avatar: avatar_path },
        })
        if (result.status === 0) {
          throw new Error('更新头像失败')
        }
      })

      // 更新session
      const updatedResult = await memberTable.fetchDetailById(member_info.member_id)
      if (updatedResult.status > 0 && updatedResult.data) {
        const updatedMember = Util.deepClone(updatedResult.data)
        updatedMember.member_id = Util.encode(updatedMember.member_id)
        ctx.session.put('member', updatedMember)
      }

      return Util.end({
        data: {
          avatar: avatar_path,
        },
        msg: '头像更新成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_updateAvatar_1739012356882',
      })
    }
  }

  /**
   * 修改密码
   */
  async updatePassword(ctx) {
    try {
      const member_info = ctx.session.get('member')
      if (!member_info || !member_info.member_id) {
        return Util.end({
          status: 0,
          msg: '用户信息不存在',
        })
      }

      const { body } = ctx
      const member_id = member_info.member_id

      // 验证旧密码
      const checkResult = await memberTable.checkPwdValid({
        username: member_info.username,
        password: body.old_password,
      })

      if (!checkResult.data.is_valid) {
        return Util.end({
          status: 0,
          msg: '旧密码不正确',
        })
      }

      // 更新密码
      await Database.transaction(async (trx) => {
        const newPassword = await Hash.make(body.new_password)
        const result = await memberTable.updateBy(trx, {
          where: [['member_id', '=', member_id]],
          set: { password: newPassword },
        })
        if (result.status === 0) {
          throw new Error('密码更新失败')
        }
      })

      return Util.end({
        msg: '密码修改成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_updatePassword_1739012356882',
      })
    }
  }
}

module.exports = ProfileService

