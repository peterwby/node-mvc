'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('moment')
moment.locale('zh-cn')
const ${module_name | pascal}Service = require(`@Services/${module_name | pascal}Service`)
const ${module_name}Service = new ${module_name | pascal}Service()

class ${module_name | pascal}Controller {
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
      const result = await ${module_name}Service.list(ctx)

      //组装从Service返回的数据，返回给前端
      const data = result.data

      //渲染视图
      return ctx.view.render('admin.${module_name}.list', data)
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
      const result = await ${module_name}Service.getList(ctx)

      //组装从Service返回的数据，返回给前端
      const { data } = result.data
      return ctx.response.json({
        data: data,
        totalCount: result.data.total,
        pageCount: result.data.perPage,
        page: result.data.page,
        lastPage: result.data.lastPage,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_getList_${timestamp}'
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
      const result = await ${module_name}Service.create(ctx)

      //组装从Service返回的数据，返回给前端
      const data = result.data

      //渲染视图
      return ctx.view.render('admin.${module_name}.create', data)
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
      const result = await ${module_name}Service.edit(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }

      //组装从Service返回的数据，返回给前端
      const data = result.data

      //渲染视图
      return ctx.view.render('admin.${module_name}.edit', data)
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
      const result = await ${module_name}Service.view(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }

      //组装从Service返回的数据，返回给前端
      const data = result.data

      //渲染视图
      return ctx.view.render('admin.${module_name}.view', data)
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
      const result = await ${module_name}Service.createInfo(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }

      return Util.end2front({
        msg: '保存成功',
        data: result.data
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_createInfo_${timestamp}'
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
      const result = await ${module_name}Service.updateInfo(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }

      return Util.end2front({
        msg: '更新成功',
        data: result.data
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_updateInfo_${timestamp}'
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
      const result = await ${module_name}Service.remove(ctx)

      return Util.end2front({
        msg: '删除成功',
        data: result.data
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_remove_${timestamp}'
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
      track: 'listValid_${timestamp}'
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
      track: 'getListValid_${timestamp}'
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
      track: 'createValid_${timestamp}'
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
      track: 'editValid_${timestamp}'
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
      track: 'viewValid_${timestamp}'
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

      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {

    }

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'createInfoValid_${timestamp}'
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

      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {

    }

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'updateInfoValid_${timestamp}'
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
      track: 'removeValid_${timestamp}'
    })
  }


}

module.exports = ${module_name | pascal}Controller
