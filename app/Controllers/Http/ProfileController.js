'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const ProfileService = require(`@Services/ProfileService`)
const profileService = new ProfileService()

class ProfileController {
  constructor() {}

  /**
   * 显示个人中心页面
   */
  async index(ctx) {
    try {
      const result = await profileService.getProfile(ctx)
      const data = {
        title: '个人中心',
        member_info: result.status > 0 ? result.data : {},
      }
      return ctx.view.render('admin.profile.index', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }

  /**
   * 获取个人信息API
   */
  async getProfile(ctx) {
    try {
      const result = await profileService.getProfile(ctx)
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_getProfile_1739012356882',
      })
    }
  }

  /**
   * 更新个人信息API
   */
  async updateProfile(ctx) {
    try {
      const resultValid = await updateProfileValid(ctx)
      if (resultValid) return resultValid

      const result = await profileService.updateProfile(ctx)
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_updateProfile_1739012356882',
      })
    }
  }

  /**
   * 更新头像API
   */
  async updateAvatar(ctx) {
    try {
      const resultValid = await updateAvatarValid(ctx)
      if (resultValid) return resultValid

      const result = await profileService.updateAvatar(ctx)
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_updateAvatar_1739012356882',
      })
    }
  }

  /**
   * 修改密码API
   */
  async updatePassword(ctx) {
    try {
      const resultValid = await updatePasswordValid(ctx)
      if (resultValid) return resultValid

      const result = await profileService.updatePassword(ctx)
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_updatePassword_1739012356882',
      })
    }
  }
}

// 验证函数
async function updateProfileValid(ctx) {
  try {
    await paramsHandle()
    await paramsValid()
    await authValid()
    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      if (requestAll.nickname !== undefined) {
        body.nickname = Util.filterXss(requestAll.nickname)
      }
      if (requestAll.email !== undefined) {
        body.email = Util.filterXss(requestAll.email)
      }
      if (requestAll.remark !== undefined) {
        body.remark = requestAll.remark
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const { body } = ctx
      const rules = {}
      if (body.email !== undefined) {
        rules.email = 'email'
      }
      if (Object.keys(rules).length > 0) {
        const messages = {
          'email.email': '邮箱格式不正确',
        }
        const validation = await validate(ctx.body, rules, messages)
        if (validation.fails()) {
          throw new Error(validation.messages()[0].message)
        }
      }
    }

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_updateProfileValid_1739012356882',
    })
  }
}

async function updateAvatarValid(ctx) {
  try {
    await paramsHandle()
    await paramsValid()
    await authValid()
    return null

    async function paramsHandle() {
      const file = ctx.request.file('file')
      if (file) {
        if (file.size > 1024 * 1024 * 5) {
          throw new Error('头像大小不能超过5M')
        }
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.extname.toLowerCase())) {
          throw new Error('只接受图片格式文件(jpg/jpeg/png/gif/webp)')
        }
        ctx.file = file
      } else {
        throw new Error('请上传头像图片')
      }
    }

    async function paramsValid() {}

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_updateAvatarValid_1739012356882',
    })
  }
}

async function updatePasswordValid(ctx) {
  try {
    await paramsHandle()
    await paramsValid()
    await authValid()
    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      if (requestAll.old_password) {
        body.old_password = requestAll.old_password
      }
      if (requestAll.new_password) {
        body.new_password = requestAll.new_password
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const { body } = ctx
      const rules = {
        old_password: 'required',
        new_password: 'required|min:6',
      }
      const messages = {
        'old_password.required': '请输入旧密码',
        'new_password.required': '请输入新密码',
        'new_password.min': '新密码长度至少为6位',
      }
      const validation = await validate(ctx.body, rules, messages)
      if (validation.fails()) {
        throw new Error(validation.messages()[0].message)
      }
    }

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_updatePasswordValid_1739012356882',
    })
  }
}

module.exports = ProfileController

