'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('moment')
moment.locale('zh-cn')
const RolesService = require(`@Services/RolesService`)
const rolesService = new RolesService()

class RolesController {
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
      const result = await rolesService.list(ctx)

      //组装从Service返回的数据，返回给前端
      const data = result.data

      //渲染视图
      return ctx.view.render('admin.roles.list', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
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
      const result = await rolesService.getList(ctx)

      //组装从Service返回的数据，返回给前端
      const { data } = result.data
      const finalData = data.map((item) => {
        return {
          ...item,
          id: item.role_id,
          role_name: item.name,
          created_at: moment(item.created_at).format('YYYY-MM-DD HH:mm:ss'),
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
   * 显示创建页面
   */
  async create(ctx) {
    try {
      //检查参数合法性
      const resultValid = await createValid(ctx)
      if (resultValid) return resultValid

      //调用业务逻辑Service
      const result = await rolesService.create(ctx)

      //组装从Service返回的数据，返回给前端
      const data = result.data

      //渲染视图
      return ctx.view.render('admin.roles.create', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
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
      const result = await rolesService.edit(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }

      //组装从Service返回的数据，返回给前端
      const data = result.data

      //渲染视图
      return ctx.view.render('admin.roles.edit', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
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
      const result = await rolesService.view(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }

      //组装从Service返回的数据，返回给前端
      const data = result.data

      //渲染视图
      return ctx.view.render('admin.roles.view', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
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
      const result = await rolesService.createInfo(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }

      return Util.end2front({
        msg: '保存成功',
        data: result.data,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_createInfo_1739012356882',
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
      const result = await rolesService.updateInfo(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }

      return Util.end2front({
        msg: '更新成功',
        data: result.data,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_updateInfo_1739012356882',
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
      const result = await rolesService.remove(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }

      return Util.end2front({
        msg: '删除成功',
        data: result.data,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_remove_1739012356882',
      })
    }
  }

  /**
   * 显示角色权限配置页面
   */
  async permissions(ctx) {
    try {
      //检查参数合法性
      const resultValid = await permissionsValid(ctx)
      if (resultValid) return resultValid

      //调用业务逻辑Service
      const result = await rolesService.edit(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }

      //组装从Service返回的数据，返回给前端
      const data = result.data

      //渲染视图
      return ctx.view.render('admin.roles.permissions', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }

  /**
   * 获取角色权限列表
   */
  async getPermissions(ctx) {
    try {
      //检查参数合法性
      const resultValid = await getPermissionsValid(ctx)
      if (resultValid) return resultValid

      //调用业务逻辑Service
      const result = await rolesService.getPermissions(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }

      return Util.end2front({
        data: result.data,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_getPermissions_1739012356882',
      })
    }
  }

  /**
   * 保存角色权限
   */
  async savePermissions(ctx) {
    try {
      //检查参数合法性
      const resultValid = await savePermissionsValid(ctx)
      if (resultValid) return resultValid

      //调用业务逻辑Service
      const result = await rolesService.savePermissions(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }

      return Util.end2front({
        msg: result.msg,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_savePermissions_1739012356882',
      })
    }
  }
}

/**
 * 列表页面参数验证
 */
async function listValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      // 只接收以下参数
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'page':
            body.page = parseInt(requestAll[k])
            break
          case 'limit':
            body.limit = parseInt(requestAll[k])
            break
        }
      }
      if (!body.page) {
        body.page = 1
      }
      if (!body.limit) {
        body.limit = 10
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {}

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'listValid_1739012356882',
    })
  }
}

/**
 * 获取列表数据参数验证
 */
async function getListValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'page':
            body.page = requestAll[k]
            break
          case 'size':
            body.limit = requestAll[k]
            break
          case 'sortorder':
            body.sortOrder = requestAll[k]
            break
          case 'sortfield':
            body.sortField = requestAll[k]
            break
          case 'role_name':
            body.role_name = requestAll[k]
            break
        }
      }
      if (!body.page) {
        body.page = 1
      }
      if (!body.limit) {
        body.limit = 10
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {}

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'getListValid_1739012356882',
    })
  }
}

/**
 * 创建页面参数验证
 */
async function createValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.params
      let body = {}

      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {}

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'createValid_1739012356882',
    })
  }
}

/**
 * 编辑页面参数验证
 */
async function editValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.params
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'id':
            {
              body.id = requestAll[k]
            }
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        id: 'required',
      }
      const messages = {
        'id.required': 'id is require',
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
      msg: err.message,
      track: 'editValid_1739012356882',
    })
  }
}

/**
 * 详情页面参数验证
 */
async function viewValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.params
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'id':
            {
              body.id = requestAll[k]
            }
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        id: 'required',
      }
      const messages = {
        'id.required': 'id is require',
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
      msg: err.message,
      track: 'viewValid_1739012356882',
    })
  }
}

/**
 * 创建信息参数验证
 */
async function createInfoValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'role_name':
            body.role_name = Util.filterXss(requestAll[k])
            break
          case 'description':
            body.description = Util.filterXss(requestAll[k])
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {}

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'createInfoValid_1739012356882',
    })
  }
}

/**
 * 更新信息参数验证
 */
async function updateInfoValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'id':
            {
              body.id = parseInt(requestAll[k])
            }
            break
          case 'role_name':
            body.role_name = Util.filterXss(requestAll[k])
            break
          case 'description':
            body.description = Util.filterXss(requestAll[k])
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {}

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'updateInfoValid_1739012356882',
    })
  }
}

/**
 * 删除记录参数验证
 */
async function removeValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'ids': {
            if (Util.isArray(requestAll[k])) {
              const ids = requestAll[k]
              if (ids.length) {
                body.ids = ids
              }
            }
          }
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        ids: 'required',
      }
      const messages = {
        'ids.required': 'ids is required',
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
      msg: err.message,
      track: 'removeValid_1739012356882',
    })
  }
}

/**
 * 权限配置页面参数验证
 */
async function permissionsValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //校验权限
    const resultAuth = await authValid()
    if (resultAuth) return resultAuth

    return null
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'valid_permissions_1739012356882',
    })
  }

  async function paramsHandle() {
    const { params } = ctx
    ctx.body = {
      id: params.id,
    }
  }

  async function paramsValid() {
    const rules = {
      id: 'required|integer',
    }
    const validation = await validate(ctx.body, rules)
    if (validation.fails()) {
      throw new Error('参数错误')
    }
  }

  async function authValid() {
    return null
  }
}

/**
 * 获取权限列表参数验证
 */
async function getPermissionsValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //校验权限
    const resultAuth = await authValid()
    if (resultAuth) return resultAuth

    return null
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'valid_getPermissions_1739012356882',
    })
  }

  async function paramsHandle() {
    const { params } = ctx
    ctx.body = {
      id: params.id,
    }
  }

  async function paramsValid() {
    const rules = {
      id: 'required|integer',
    }
    const validation = await validate(ctx.body, rules)
    if (validation.fails()) {
      throw new Error('参数错误')
    }
  }

  async function authValid() {
    return null
  }
}

/**
 * 保存权限参数验证
 */
async function savePermissionsValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //校验权限
    const resultAuth = await authValid()
    if (resultAuth) return resultAuth

    return null
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'valid_savePermissions_1739012356882',
    })
  }

  async function paramsHandle() {
    const { params, request } = ctx
    ctx.body = {
      id: params.id,
      permission_ids: request.body.permission_ids || [],
    }
  }

  async function paramsValid() {
    const rules = {
      id: 'required|integer',
      permission_ids: 'array',
      'permission_ids.*': 'integer',
    }
    const validation = await validate(ctx.body, rules)
    if (validation.fails()) {
      throw new Error('参数错误')
    }
  }

  async function authValid() {
    return null
  }
}

module.exports = RolesController
