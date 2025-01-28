'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const {{ table_name }}Table = require('@Table/{{ table_name }}')
const {{ table_name_camel }}Table = new {{ table_name }}Table()

class Service extends BaseService {
  /**
   * 获取列表页数据
   */
  async list(ctx) {
    try {
      let result = {}
      const { body } = ctx

      {{ select_list_data }}

      const data = {
        {{ select_list_vars }}
      }
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_list_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 获取列表
   */
  async getList(ctx) {
    try {
      let result = {}
      const { body } = ctx
      result = await {{ table_name_camel }}Table.fetchListBy(body)
      return Util.end({
        data: result.data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_getList_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 创建页面数据
   */
  async create(ctx) {
    try {
      let result = {}
      const { body } = ctx

      {{ select_list_data }}

      const data = {
        {{ select_list_vars }}
      }
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_create_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 创建数据
   */
  async createInfo(ctx) {
    try {
      let result = {}
      const { body } = ctx

      await Database.transaction(async (trx) => {
        let column = {
          {{ create_fields }}
        }
        result = await {{ table_name_camel }}Table.create(trx, column)
        if (result.status === 0) {
          throw new Error('新增失败')
        }
      })

      return Util.end({
        msg: '新增成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_createInfo_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 查看数据
   */
  async view(ctx) {
    try {
      let result = {}
      const { body } = ctx
      const { id } = body

      result = await {{ table_name_camel }}Table.fetchDetailById(id)
      if (result.status === 0) {
        return Util.end({
          msg: result.msg,
          status: result.status,
        })
      }

      const data = {
        info: result.data,
      }
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_view_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 编辑页面数据
   */
  async edit(ctx) {
    try {
      let result = {}
      const { body } = ctx
      const { id } = body

      result = await {{ table_name_camel }}Table.fetchDetailById(id)
      if (result.status === 0) {
        return Util.end({
          msg: result.msg,
          status: result.status,
        })
      }

      {{ select_list_data }}

      const data = {
        info: result.data,
        {{ select_list_vars }}
      }
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_edit_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 更新数据
   */
  async editInfo(ctx) {
    try {
      let result = {}
      const { body } = ctx
      const { id } = body

      await Database.transaction(async (trx) => {
        let column = {
          {{ edit_fields }}
        }
        result = await {{ table_name_camel }}Table.update(trx, id, column)
        if (result.status === 0) {
          throw new Error('更新失败')
        }
      })

      return Util.end({
        msg: '更新成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_editInfo_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 删除数据
   */
  async remove(ctx) {
    try {
      let result = {}
      const { body } = ctx
      const { id } = body

      await Database.transaction(async (trx) => {
        result = await {{ table_name_camel }}Table.remove(trx, id)
        if (result.status === 0) {
          throw new Error('删除失败')
        }
      })

      return Util.end({
        msg: '删除成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_remove_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 批量删除数据
   */
  async batchRemove(ctx) {
    try {
      let result = {}
      const { body } = ctx
      const { ids } = body

      await Database.transaction(async (trx) => {
        for (let id of ids) {
          result = await {{ table_name_camel }}Table.remove(trx, id)
          if (result.status === 0) {
            throw new Error('删除失败')
          }
        }
      })

      return Util.end({
        msg: '删除成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_batchRemove_' + Util.genRandomString(),
      })
    }
  }
}

module.exports = Service
