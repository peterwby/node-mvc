'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const log = use('Logger')
const ${module_name | capitalize}Table = require('@Table/${module_name}')
const ${module_name}Table = new ${module_name | capitalize}Table()

class ${module_name | capitalize}Service extends BaseService {
  /**
   * 获取列表页面数据
   */
  async list(ctx) {
    try {
      return Util.end({
        data: {
          title: '${module_name}管理'
        }
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_list_${timestamp}'
      })
    }
  }

  /**
   * 获取列表数据
   */
  async getList(ctx) {
    try {
      const { body } = ctx
      const { page = 1, limit = 10, ...filters } = body

      // 构建查询条件
      const where = []
      <%each(field in fields)%>
        <%if(field.filterable)%>
          if (filters.${field.name}) {
            <%if(field.type === 'string')%>
              where.push(['${field.name}', 'like', `%${filters.${field.name}}%`])
            <%else%>
              where.push(['${field.name}', '=', filters.${field.name}])
            <%endif%>
          }
        <%endif%>
      <%endeach%>

      // 查询数据
      const result = await ${module_name}Table.fetchAll({
        where,
        page,
        limit
      })

      return result
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_getList_${timestamp}'
      })
    }
  }

  /**
   * 获取创建页面数据
   */
  async create(ctx) {
    try {
      return Util.end({
        data: {
          title: '创建${module_name}'
        }
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_create_${timestamp}'
      })
    }
  }

  /**
   * 获取编辑页面数据
   */
  async edit(ctx) {
    try {
      const { query } = ctx
      const { id } = query

      // 获取详情
      const result = await ${module_name}Table.fetchDetailById(id)
      if (result.status === 0) {
        return Util.end({
          msg: result.msg,
          status: result.status
        })
      }

      return Util.end({
        data: {
          title: '编辑${module_name}',
          info: result.data
        }
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_edit_${timestamp}'
      })
    }
  }

  /**
   * 获取详情页面数据
   */
  async view(ctx) {
    try {
      const { query } = ctx
      const { id } = query

      // 获取详情
      const result = await ${module_name}Table.fetchDetailById(id)
      if (result.status === 0) {
        return Util.end({
          msg: result.msg,
          status: result.status
        })
      }

      return Util.end({
        data: {
          title: '${module_name}详情',
          info: result.data
        }
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_view_${timestamp}'
      })
    }
  }

  /**
   * 创建记录
   */
  async createInfo(ctx) {
    try {
      let result = {}
      const { body } = ctx
      //检查数据是否已存在
      result = await ${module_name}Table.checkExistByColumn({ id: body.id })
      if (result.data.is_exist) {
        return Util.end({
          status: 0,
          msg: '无法新增，数据已存在',
        })
      }
      //开始创建新记录
      await Database.transaction(async (trx) => {
        result = await ${module_name}Table.create(trx, body)
        if (result.status === 0) {
          throw new Error('新增失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_createInfo_${timestamp}'
      })
    }
  }

  /**
   * 更新记录
   */
  async updateInfo(ctx) {
    try {
      let result = {}
      let column = {}
      const { body } = ctx


      await Database.transaction(async (trx) => {
        result = await ${module_name}Table.updateBy(trx, {
          where: [],
          set: { },
        })
        if (result.status === 0) {
          throw new Error('保存失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_updateInfo_${timestamp}'
      })
    }
  }

  /**
   * 删除记录
   */
  async remove(ctx) {
    try {
      let result = {}
      const { body } = ctx
      await Database.transaction(async (trx) => {
        result = await ${module_name}Table.deleteByIds(trx, body.ids)
        if (result.status === 0) {
          throw new Error('删除失败')
        }
      })

      return Util.end({
        data: result.data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_remove_${timestamp}'
      })
    }
  }
}

module.exports = ${module_name | capitalize}Service
