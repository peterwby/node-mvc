'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const Helpers = use('Helpers')
const SystemConfigService = require(`@Services/SystemConfigService`)
const systemConfigService = new SystemConfigService()

class SystemConfigController {
  constructor() {}

  /**
   * 显示配置编辑页面
   */
  async edit(ctx) {
    try {
      //调用业务逻辑Service
      const result = await systemConfigService.getList(ctx)

      //组装数据
      const configs = result.data || []
      const configObj = {}
      const configGroups = {
        basic: [],
        appearance: [],
        upload: [],
        system: [],
      }

      configs.forEach((item) => {
        configObj[item.config_key] = item.config_value
        if (configGroups[item.config_group]) {
          configGroups[item.config_group].push(item)
        }
      })

      const data = {
        title: '系统配置',
        configs: configObj,
        configGroups: configGroups,
      }

      //渲染视图
      return ctx.view.render('admin.system-config.edit', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }

  /**
   * 获取配置列表API
   */
  async getList(ctx) {
    try {
      const resultValid = await getListValid(ctx)
      if (resultValid) return resultValid

      const result = await systemConfigService.getList(ctx)
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_getList_1739012356882',
      })
    }
  }

  /**
   * 更新单个配置API
   */
  async updateConfig(ctx) {
    try {
      const resultValid = await updateConfigValid(ctx)
      if (resultValid) return resultValid

      const { body } = ctx
      const result = await systemConfigService.updateConfig(body.config_key, body.config_value)
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_updateConfig_1739012356882',
      })
    }
  }

  /**
   * 批量更新配置API
   */
  async batchUpdate(ctx) {
    try {
      const resultValid = await batchUpdateValid(ctx)
      if (resultValid) return resultValid

      const { body } = ctx
      const result = await systemConfigService.batchUpdateConfigs(body.configs || {})
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_batchUpdate_1739012356882',
      })
    }
  }

  /**
   * 上传Logo API
   */
  async uploadLogo(ctx) {
    try {
      const resultValid = await uploadLogoValid(ctx)
      if (resultValid) return resultValid

      const { file } = ctx
      const member_info = ctx.session.get('member')
      const file_name = `logo_${Date.now()}.${file.subtype}`
      
      await file.move(Helpers.publicPath('upload/images'), {
        name: file_name,
        overwrite: true,
      })
      
      if (!file.moved()) {
        throw new Error('上传Logo失败')
      }

      const file_path = `/upload/images/${file_name}`
      
      // 更新配置
      const result = await systemConfigService.updateConfig('logo_url', file_path)
      
      return Util.end2front({
        data: {
          url: file_path,
        },
        msg: '上传成功',
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_uploadLogo_1739012356882',
      })
    }
  }

  /**
   * 上传登录页背景图API
   */
  async uploadLoginBg(ctx) {
    try {
      const resultValid = await uploadLoginBgValid(ctx)
      if (resultValid) return resultValid

      const { file, body } = ctx
      const member_info = ctx.session.get('member')
      const mode = body.mode || 'light' // light 或 dark
      const file_name = `login_bg_${mode}_${Date.now()}.${file.subtype}`
      
      await file.move(Helpers.publicPath('upload/images'), {
        name: file_name,
        overwrite: true,
      })
      
      if (!file.moved()) {
        throw new Error('上传背景图失败')
      }

      const file_path = `/upload/images/${file_name}`
      const config_key = mode === 'dark' ? 'login_bg_image_dark' : 'login_bg_image'
      
      // 更新配置
      const result = await systemConfigService.updateConfig(config_key, file_path)
      
      return Util.end2front({
        data: {
          url: file_path,
        },
        msg: '上传成功',
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_uploadLoginBg_1739012356882',
      })
    }
  }
}

// 验证函数
async function getListValid(ctx) {
  try {
    return null
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_getListValid_1739012356882',
    })
  }
}

async function updateConfigValid(ctx) {
  try {
    await paramsHandle()
    await paramsValid()
    await authValid()
    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      if (requestAll.config_key) {
        body.config_key = Util.filterXss(requestAll.config_key)
      }
      if (requestAll.config_value !== undefined) {
        body.config_value = requestAll.config_value
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const { body } = ctx
      const rules = {
        config_key: 'required',
      }
      const messages = {
        'config_key.required': '配置键名不能为空',
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
      track: 'valid_updateConfigValid_1739012356882',
    })
  }
}

async function batchUpdateValid(ctx) {
  try {
    await paramsHandle()
    await paramsValid()
    await authValid()
    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      if (requestAll.configs && typeof requestAll.configs === 'object') {
        body.configs = requestAll.configs
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const { body } = ctx
      if (!body.configs || typeof body.configs !== 'object') {
        throw new Error('配置数据格式不正确')
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
      track: 'valid_batchUpdateValid_1739012356882',
    })
  }
}

async function uploadLogoValid(ctx) {
  try {
    await paramsHandle()
    await paramsValid()
    await authValid()
    return null

    async function paramsHandle() {
      const file = ctx.request.file('file')
      if (file) {
        if (file.size > 1024 * 1024 * 5) {
          throw new Error('Logo大小不能超过5M')
        }
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(file.extname.toLowerCase())) {
          throw new Error('只接受图片格式文件(jpg/jpeg/png/gif/webp/svg)')
        }
        ctx.file = file
      } else {
        throw new Error('请上传Logo图片')
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
      track: 'valid_uploadLogoValid_1739012356882',
    })
  }
}

async function uploadLoginBgValid(ctx) {
  try {
    await paramsHandle()
    await paramsValid()
    await authValid()
    return null

    async function paramsHandle() {
      const file = ctx.request.file('file')
      const requestAll = ctx.request.all()
      let body = {}
      if (requestAll.mode) {
        body.mode = requestAll.mode
      }
      ctx.body = body

      if (file) {
        if (file.size > 1024 * 1024 * 10) {
          throw new Error('背景图大小不能超过10M')
        }
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.extname.toLowerCase())) {
          throw new Error('只接受图片格式文件(jpg/jpeg/png/gif/webp)')
        }
        ctx.file = file
      } else {
        throw new Error('请上传背景图片')
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
      track: 'valid_uploadLoginBgValid_1739012356882',
    })
  }
}

module.exports = SystemConfigController

