'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('dayjs')
const NoticeService = require(`@Services/NoticeService`)
const noticeService = new NoticeService()

class NoticeController {
  constructor() {}

  /**
   * 显示公告列表页面
   */
  async list(ctx) {
    try {
      const data = {
        title: '系统公告',
      }
      return ctx.view.render('admin.notices.list', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }

  /**
   * 显示创建公告页面
   */
  async create(ctx) {
    try {
      const data = {
        title: '创建公告',
      }
      return ctx.view.render('admin.notices.create', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }

  /**
   * 显示编辑公告页面
   */
  async edit(ctx) {
    try {
      const { params } = ctx
      const noticeId = params.id

      const result = await noticeService.getList(ctx)
      const notices = result.data.data || []
      const notice = notices.find((n) => n.notice_id == noticeId)

      if (!notice) {
        return ctx.view.render('error.404')
      }

      const data = {
        title: '编辑公告',
        notice: notice,
      }
      return ctx.view.render('admin.notices.edit', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }

  /**
   * 获取公告列表API
   */
  async getList(ctx) {
    try {
      const resultValid = await getListValid(ctx)
      if (resultValid) return resultValid

      const result = await noticeService.getList(ctx)
      const { data } = result.data
      const finalData = data.map((item) => {
        return {
          ...item,
          id: item.notice_id,
          created_at: item.created_at ? moment(item.created_at).format('YYYY-MM-DD HH:mm:ss') : '',
          publish_time: item.publish_time ? moment(item.publish_time).format('YYYY-MM-DD HH:mm:ss') : '',
          expire_time: item.expire_time ? moment(item.expire_time).format('YYYY-MM-DD HH:mm:ss') : '',
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
   * 创建公告API
   */
  async createInfo(ctx) {
    try {
      const resultValid = await createInfoValid(ctx)
      if (resultValid) return resultValid

      const result = await noticeService.create(ctx)
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_createInfo_1739012356882',
      })
    }
  }

  /**
   * 更新公告API
   */
  async updateInfo(ctx) {
    try {
      const resultValid = await updateInfoValid(ctx)
      if (resultValid) return resultValid

      const result = await noticeService.update(ctx)
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_updateInfo_1739012356882',
      })
    }
  }

  /**
   * 删除公告API
   */
  async remove(ctx) {
    try {
      const resultValid = await removeValid(ctx)
      if (resultValid) return resultValid

      const result = await noticeService.remove(ctx)
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_remove_1739012356882',
      })
    }
  }
}

// 验证函数
async function getListValid(ctx) {
  try {
    await paramsHandle()
    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      if (requestAll.status !== undefined && requestAll.status !== '') {
        body.status = parseInt(requestAll.status)
      }
      if (requestAll.is_top !== undefined && requestAll.is_top !== '') {
        body.is_top = parseInt(requestAll.is_top)
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

async function createInfoValid(ctx) {
  try {
    await paramsHandle()
    await paramsValid()
    await authValid()
    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      if (requestAll.title) {
        body.title = Util.filterXss(requestAll.title)
      }
      if (requestAll.content !== undefined) {
        body.content = requestAll.content
      }
      if (requestAll.type) {
        body.type = requestAll.type
      }
      if (requestAll.status !== undefined) {
        body.status = requestAll.status
      }
      if (requestAll.is_top !== undefined) {
        body.is_top = requestAll.is_top
      }
      if (requestAll.publish_time) {
        body.publish_time = requestAll.publish_time
      }
      if (requestAll.expire_time) {
        body.expire_time = requestAll.expire_time || null
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const { body } = ctx
      const rules = {
        title: 'required',
        content: 'required',
      }
      const messages = {
        'title.required': '公告标题不能为空',
        'content.required': '公告内容不能为空',
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
      track: 'valid_createInfoValid_1739012356882',
    })
  }
}

async function updateInfoValid(ctx) {
  try {
    await paramsHandle()
    await paramsValid()
    await authValid()
    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      if (requestAll.notice_id || requestAll.id) {
        body.notice_id = requestAll.notice_id || requestAll.id
      }
      if (requestAll.title) {
        body.title = Util.filterXss(requestAll.title)
      }
      if (requestAll.content !== undefined) {
        body.content = requestAll.content
      }
      if (requestAll.type) {
        body.type = requestAll.type
      }
      if (requestAll.status !== undefined) {
        body.status = requestAll.status
      }
      if (requestAll.is_top !== undefined) {
        body.is_top = requestAll.is_top
      }
      if (requestAll.publish_time) {
        body.publish_time = requestAll.publish_time
      }
      if (requestAll.expire_time !== undefined) {
        body.expire_time = requestAll.expire_time || null
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const { body } = ctx
      if (!body.notice_id) {
        throw new Error('公告ID不能为空')
      }
      const rules = {
        title: 'required',
        content: 'required',
      }
      const messages = {
        'title.required': '公告标题不能为空',
        'content.required': '公告内容不能为空',
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
      track: 'valid_updateInfoValid_1739012356882',
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
      if (requestAll.ids && Array.isArray(requestAll.ids)) {
        body.ids = requestAll.ids.map((id) => parseInt(id)).filter((id) => !isNaN(id))
      } else if (requestAll.id) {
        body.ids = [parseInt(requestAll.id)]
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const { body } = ctx
      if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
        throw new Error('请选择要删除的公告')
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

module.exports = NoticeController

