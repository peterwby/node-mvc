'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const FileService = require(`@Services/FileService`)
const fileService = new FileService()

class FileController {
  constructor() {}

  /**
   * 显示文件列表页面
   */
  async list(ctx) {
    try {
      const data = {
        title: '文件管理',
      }
      return ctx.view.render('admin.files.list', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }

  /**
   * 获取文件列表API
   */
  async getList(ctx) {
    try {
      const resultValid = await getListValid(ctx)
      if (resultValid) return resultValid

      const result = await fileService.getFileList(ctx)
      const { data } = result.data
      const finalData = data.map((item) => {
        return {
          ...item,
          id: item.file_id,
          file_size_formatted: formatFileSize(item.file_size),
          created_at: item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '',
        }
      })
      return ctx.response.json({
        data: finalData,
        totalCount: result.data.total,
        pageCount: result.data.perPage,
        page: result.data.page,
        lastPage: result.data.lastPage,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_getList_1739012356882',
      })
    }
  }

  /**
   * 上传文件API
   */
  async upload(ctx) {
    try {
      const resultValid = await uploadValid(ctx)
      if (resultValid) return resultValid

      const result = await fileService.uploadFile(ctx)
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_upload_1739012356882',
      })
    }
  }

  /**
   * 删除文件API
   */
  async remove(ctx) {
    try {
      const resultValid = await removeValid(ctx)
      if (resultValid) return resultValid

      const result = await fileService.deleteFile(ctx)
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_remove_1739012356882',
      })
    }
  }

  /**
   * 批量删除文件API
   */
  async batchRemove(ctx) {
    try {
      const resultValid = await batchRemoveValid(ctx)
      if (resultValid) return resultValid

      const result = await fileService.batchDelete(ctx)
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_batchRemove_1739012356882',
      })
    }
  }
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 验证函数
async function getListValid(ctx) {
  try {
    await paramsHandle()
    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      if (requestAll.category) {
        body.category = requestAll.category
      }
      if (requestAll.search) {
        body.search = Util.filterXss(requestAll.search)
      }
      if (requestAll.page) {
        body.page = parseInt(requestAll.page) || 1
      }
      if (requestAll.limit) {
        body.limit = parseInt(requestAll.limit) || 20
      }
      ctx.body = Util.deepClone(body)
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_getListValid_1739012356882',
    })
  }
}

async function uploadValid(ctx) {
  try {
    await paramsHandle()
    await paramsValid()
    await authValid()
    return null

    async function paramsHandle() {
      const file = ctx.request.file('file')
      if (file) {
        ctx.file = file
      } else {
        throw new Error('请上传文件')
      }
    }

    async function paramsValid() {
      // 文件验证在Service中处理
    }

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_uploadValid_1739012356882',
    })
  }
}

async function removeValid(ctx) {
  try {
    await paramsHandle()
    await paramsValid()
    await authValid()
    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      if (requestAll.file_id) {
        body.file_id = requestAll.file_id
      } else if (requestAll.id) {
        body.id = requestAll.id
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const { body } = ctx
      if (!body.file_id && !body.id) {
        throw new Error('文件ID不能为空')
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
      track: 'valid_removeValid_1739012356882',
    })
  }
}

async function batchRemoveValid(ctx) {
  try {
    await paramsHandle()
    await paramsValid()
    await authValid()
    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      if (requestAll.ids && Array.isArray(requestAll.ids)) {
        body.ids = requestAll.ids.map(id => parseInt(id)).filter(id => !isNaN(id))
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const { body } = ctx
      if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
        throw new Error('请选择要删除的文件')
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
      track: 'valid_batchRemoveValid_1739012356882',
    })
  }
}

module.exports = FileController

