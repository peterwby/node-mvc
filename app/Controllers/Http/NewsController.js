'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('moment')
moment.locale('zh-cn')
const NewsService = require(`@Services/NewsService`)
const newsService = new NewsService()

class NewsController {
  constructor() {}

  /**
   * 显示列表页面
   */
  async list(ctx) {
    try {
      //检查参数合法性
      const resultValid = await listValid(ctx)
      if (resultValid) return resultValid

      //调用业务逻辑Service
      const result = await newsService.list(ctx)

      return Util.end2front({
        msg: '获取成功',
        data: result.data
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_list_1738766554641'
      })
    }
  }

  /**
   * 获取列表数据
   */
  async getList(ctx) {
    try {
      //检查参数合法性
      const resultValid = await getListValid(ctx)
      if (resultValid) return resultValid

      //调用业务逻辑Service
      const result = await newsService.getList(ctx)

      return Util.end2front({
        msg: '获取成功',
        data: result.data
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_getList_1738766554641'
      })
    }
  }

  /**
   * 显示创建页面
   */
  async create(ctx) {
    try {
      //检查参数合法性
      const resultValid = await createValid(ctx)
      if (resultValid) return resultValid

      //调用业务逻辑Service
      const result = await newsService.create(ctx)

      return Util.end2front({
        msg: '创建成功',
        data: result.data
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_create_1738766554641'
      })
    }
  }

  /**
   * 显示编辑页面
   */
  async edit(ctx) {
    try {
      //检查参数合法性
      const resultValid = await editValid(ctx)
      if (resultValid) return resultValid

      //调用业务逻辑Service
      const result = await newsService.edit(ctx)

      return Util.end2front({
        msg: '获取成功',
        data: result.data
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_edit_1738766554641'
      })
    }
  }

  /**
   * 显示详情页面
   */
  async view(ctx) {
    try {
      //检查参数合法性
      const resultValid = await viewValid(ctx)
      if (resultValid) return resultValid

      //调用业务逻辑Service
      const result = await newsService.view(ctx)

      return Util.end2front({
        msg: '获取成功',
        data: result.data
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_view_1738766554641'
      })
    }
  }

  /**
   * 保存新记录
   */
  async createInfo(ctx) {
    try {
      //检查参数合法性
      const resultValid = await createInfoValid(ctx)
      if (resultValid) return resultValid

      //调用业务逻辑Service
      const result = await newsService.createInfo(ctx)

      return Util.end2front({
        msg: '保存成功',
        data: result.data
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_createInfo_1738766554641'
      })
    }
  }

  /**
   * 更新记录
   */
  async updateInfo(ctx) {
    try {
      //检查参数合法性
      const resultValid = await updateInfoValid(ctx)
      if (resultValid) return resultValid

      //调用业务逻辑Service
      const result = await newsService.updateInfo(ctx)

      return Util.end2front({
        msg: '更新成功',
        data: result.data
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_updateInfo_1738766554641'
      })
    }
  }

  /**
   * 删除记录
   */
  async remove(ctx) {
    try {
      //检查参数合法性
      const resultValid = await removeValid(ctx)
      if (resultValid) return resultValid

      //调用业务逻辑Service
      const result = await newsService.remove(ctx)

      return Util.end2front({
        msg: '删除成功',
        data: result.data
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_remove_1738766554641'
      })
    }
  }
}

/**
 * 列表页面参数验证
 */
async function listValid(ctx) {
  try {
    //参数处理
    await paramsHandle()
    //参数验证
    await paramsValid()
    //权限验证
    await authValid()
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'listValid_1738766554641'
    })
  }

  async function paramsHandle() {
    const { query } = ctx
    ctx.body = query
  }

  async function paramsValid() {}

  async function authValid() {}
}

/**
 * 获取列表数据参数验证
 */
async function getListValid(ctx) {
  try {
    //参数处理
    await paramsHandle()
    //参数验证
    await paramsValid()
    //权限验证
    await authValid()
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'getListValid_1738766554641'
    })
  }

  async function paramsHandle() {
    const { query } = ctx
    ctx.body = query
  }

  async function paramsValid() {}

  async function authValid() {}
}

/**
 * 创建页面参数验证
 */
async function createValid(ctx) {
  try {
    //参数处理
    await paramsHandle()
    //参数验证
    await paramsValid()
    //权限验证
    await authValid()
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'createValid_1738766554641'
    })
  }

  async function paramsHandle() {
    const { query } = ctx
    ctx.body = query
  }

  async function paramsValid() {}

  async function authValid() {}
}

/**
 * 编辑页面参数验证
 */
async function editValid(ctx) {
  try {
    //参数处理
    await paramsHandle()
    //参数验证
    await paramsValid()
    //权限验证
    await authValid()
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'editValid_1738766554641'
    })
  }

  async function paramsHandle() {
    const { query } = ctx
    ctx.body = query
  }

  async function paramsValid() {}

  async function authValid() {}
}

/**
 * 详情页面参数验证
 */
async function viewValid(ctx) {
  try {
    //参数处理
    await paramsHandle()
    //参数验证
    await paramsValid()
    //权限验证
    await authValid()
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'viewValid_1738766554641'
    })
  }

  async function paramsHandle() {
    const { query } = ctx
    ctx.body = query
  }

  async function paramsValid() {}

  async function authValid() {}
}

/**
 * 创建信息参数验证
 */
async function createInfoValid(ctx) {
  try {
    //参数处理
    await paramsHandle()
    //参数验证
    await paramsValid()
    //权限验证
    await authValid()
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'createInfoValid_1738766554641'
    })
  }

  async function paramsHandle() {
    const { body } = ctx
    ctx.body = body
  }

  async function paramsValid() {
    const rules = {
      
        
      
        
      
        
      
    }

    const validation = await validate(ctx.body, rules)
    if (validation.fails()) {
      throw new Error(validation.messages()[0].message)
    }
  }

  async function authValid() {}
}

/**
 * 更新信息参数验证
 */
async function updateInfoValid(ctx) {
  try {
    //参数处理
    await paramsHandle()
    //参数验证
    await paramsValid()
    //权限验证
    await authValid()
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'updateInfoValid_1738766554641'
    })
  }

  async function paramsHandle() {
    const { body } = ctx
    ctx.body = body
  }

  async function paramsValid() {
    const rules = {
      
        
      
        
      
        
      
    }

    const validation = await validate(ctx.body, rules)
    if (validation.fails()) {
      throw new Error(validation.messages()[0].message)
    }
  }

  async function authValid() {}
}

/**
 * 删除记录参数验证
 */
async function removeValid(ctx) {
  try {
    //参数处理
    await paramsHandle()
    //参数验证
    await paramsValid()
    //权限验证
    await authValid()
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'removeValid_1738766554641'
    })
  }

  async function paramsHandle() {
    const { body } = ctx
    ctx.body = body
  }

  async function paramsValid() {
    const rules = {
      id: 'required'
    }

    const validation = await validate(ctx.body, rules)
    if (validation.fails()) {
      throw new Error(validation.messages()[0].message)
    }
  }

  async function authValid() {}
}

module.exports = NewsController
