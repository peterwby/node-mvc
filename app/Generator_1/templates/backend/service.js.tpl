'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const {{ class_name }}Table = require('@Table/{{ table_name }}')
const {{ table_name_camel }} = new {{ class_name }}Table()

class {{ service_name }} extends BaseService {
  /**
   * 获取列表页数据
   */
  async list(ctx) {
    try {
      return Util.end({
        data: {},
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_list_{{ timestamp }}',
      })
    }
  }

  /**
   * 获取列表数据
   */
  async getList(ctx) {
    try {
      const { body } = ctx
      const result = await {{ table_name_camel }}.fetchListBy(body)
      return Util.end({
        data: result.data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_getList_{{ timestamp }}',
      })
    }
  }

  /**
   * 获取创建页数据
   */
  async create(ctx) {
    try {
      return Util.end({
        data: {},
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_create_{{ timestamp }}',
      })
    }
  }

  /**
   * 创建数据
   */
  async createInfo(ctx) {
    try {
      const { body } = ctx
      //检查标题是否已被占用
      const result = await {{ table_name_camel }}.checkExistByColumn({ title: body.title })
      if (result.data.is_exist) {
        return Util.end({
          status: 0,
          msg: '此标题已被使用',
        })
      }
      //检查通过，开始创建新记录
      await Database.transaction(async (trx) => {
        const result = await {{ table_name_camel }}.create(trx, body)
        if (result.status === 0) {
          throw new Error('新增失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_createInfo_{{ timestamp }}',
      })
    }
  }

  /**
   * 获取查看页数据
   */
  async view(ctx) {
    try {
      const { body } = ctx
      const { id } = body

      //获取信息
      const result = await {{ table_name_camel }}.fetchOneById(id)
      if (!result.data) {
        return Util.end({
          status: 0,
          msg: '记录不存在',
        })
      }

      return Util.end({
        data: {
          info: result.data,
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_view_{{ timestamp }}',
      })
    }
  }

  /**
   * 获取编辑页数据
   */
  async edit(ctx) {
    try {
      const { body } = ctx
      const { id } = body

      //获取信息
      const result = await {{ table_name_camel }}.fetchOneById(id)
      if (!result.data) {
        return Util.end({
          status: 0,
          msg: '记录不存在',
        })
      }

      return Util.end({
        data: {
          info: result.data,
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_edit_' + Date.now(),
      })
    }
  }

  /**
   * 更新数据
   */
  async updateInfo(ctx) {
    try {
      const { body } = ctx
      await Database.transaction(async (trx) => {
        const result = await {{ table_name_camel }}.updateBy(trx, {
          where: [['id', '=', body.id]],
          set: body,
        })
        if (result.status === 0) {
          throw new Error('保存失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_updateInfo_{{ timestamp }}',
      })
    }
  }

  /**
   * 删除数据
   */
  async remove(ctx) {
    try {
      const { body } = ctx
      await Database.transaction(async (trx) => {
        const result = await {{ table_name_camel }}.deleteByIds(trx, body.ids)
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
        stack: err.stack,
        track: 'service_remove_{{ timestamp }}',
      })
    }
  }
}

module.exports = {{ service_name }}
