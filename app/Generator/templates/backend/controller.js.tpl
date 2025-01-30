'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('moment') //日期格式化插件
moment.locale('zh-cn') //设为北京时区
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
      return Util.error({
        msg: err.message,
        track: 'controller_list_{{ timestamp }}',
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
      return Util.error({
        msg: err.message,
        track: 'controller_create_{{ timestamp }}',
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
        return Util.end({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      const { info } = result.data
      info.id = Util.encode(info.id)
      info.created_at = moment(info.created_at).format('YYYY-MM-DD')

      //渲染视图
      return ctx.view.render('{{ view_path }}.view', { info })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'controller_view_{{ timestamp }}',
      })
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
        return Util.end({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      const { info } = result.data
      info.id = Util.encode(info.id)
      info.created_at = moment(info.created_at).format('YYYY-MM-DD')

      //渲染视图
      return ctx.view.render('{{ view_path }}.edit', { info })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'controller_edit_{{ timestamp }}',
      })
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
        id: Util.encode(item.id),
        created_at: moment(item.created_at).format('YYYY-MM-DD'),
      }))

      return ctx.response.json({
        data: finalData,
        totalCount: result.data.total,
        pageCount: result.data.perPage,
        page: result.data.page,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'controller_getList_{{ timestamp }}',
      })
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
      //组装从Service返回的数据，返回给前端
      if (result.status === 0) {
        return Util.end({
          msg: result.msg,
          code: 9000,
        })
      }
      return Util.end({
        msg: '已创建',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'controller_createInfo_{{ timestamp }}',
      })
    }
  }

  async updateInfo(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await updateInfoValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await {{ service_var }}.updateInfo(ctx)
      //组装从Service返回的数据，返回给前端
      if (result.status === 0) {
        return Util.end({
          msg: result.msg,
          code: 9000,
        })
      }
      return Util.end({
        msg: '已更新',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'controller_updateInfo_{{ timestamp }}',
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
      //组装从Service返回的数据，返回给前端
      if (result.status === 0) {
        return Util.end({
          msg: result.msg,
          code: 9000,
        })
      }
      return Util.end({
        msg: '已删除',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'controller_remove_{{ timestamp }}',
      })
    }
  }

}

{{ validation_functions }}

module.exports = {{ controller_name }}
