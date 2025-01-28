'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('moment')
moment.locale('zh-cn')
const {{ service_name }} = require(`@Services/{{ service_name }}`)
const {{ service_var }} = new {{ service_name }}()

class {{ controller_name }} {
  constructor() {}

  async list(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await listValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await {{ service_var }}.list(ctx)
      //组装从Service返回的数据，返回给前端
      const data = result.data

      //渲染视图
      return ctx.view.render('{{ view_path }}.list', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }

  async getList(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await getListValid(ctx)
      if (resultValid) return resultValid
      result = await {{ service_var }}.getList(ctx)
      //组装从Service返回的数据，返回给前端
      const { data } = result.data
      const finalData = data.map((item) => ({
        ...item,
        {{ primary_key }}: Util.encode(item.{{ primary_key }}),
        created_at: moment(item.created_at).format('YYYY-MM-DD'),
      }))

      return ctx.response.json({
        data: finalData,
        totalCount: result.data.total,
        pageCount: result.data.perPage,
        page: result.data.page,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_getList_' + Util.genRandomString(),
      })
    }
  }

  async create(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await createValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await {{ service_var }}.create(ctx)
      //组装从Service返回的数据，返回给前端
      const data = result.data

      //渲染视图
      return ctx.view.render('{{ view_path }}.create', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }

  async createInfo(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await createInfoValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await {{ service_var }}.createInfo(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      return Util.end2front({
        msg: '已新增',
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_createInfo_' + Util.genRandomString(),
      })
    }
  }

  async view(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await viewValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await {{ service_var }}.view(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      const { info } = result.data
      info.{{ primary_key }} = Util.encode(info.{{ primary_key }})
      info.created_at = moment(info.created_at).format('YYYY-MM-DD')

      //渲染视图
      return ctx.view.render('{{ view_path }}.view', { info })
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }

  async edit(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await editValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await {{ service_var }}.edit(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      const { info, {{ select_list_vars }} } = result.data
      info.{{ primary_key }} = Util.encode(info.{{ primary_key }})
      info.created_at = moment(info.created_at).format('YYYY-MM-DD')

      //渲染视图
      return ctx.view.render('{{ view_path }}.edit', { info, {{ select_list_vars }} })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_edit_' + Util.genRandomString(),
      })
    }
  }

  async editInfo(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await editInfoValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await {{ service_var }}.editInfo(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      return Util.end2front({
        msg: '已更新',
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_editInfo_' + Util.genRandomString(),
      })
    }
  }

  async remove(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await removeValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await {{ service_var }}.remove(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      return Util.end2front({
        msg: '已删除',
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_remove_' + Util.genRandomString(),
      })
    }
  }

  async batchRemove(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await batchRemoveValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await {{ service_var }}.batchRemove(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      return Util.end2front({
        msg: '已删除',
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_batchRemove_' + Util.genRandomString(),
      })
    }
  }
}

{{ validation_functions }}

module.exports = {{ controller_name }}
