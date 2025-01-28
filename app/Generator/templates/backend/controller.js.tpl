'use strict'

const BaseController = require('@BaseClass/BaseController')
const {{ service_name }} = require('@Service/{{ service_name }}')
const {{ service_var }} = new {{ service_name }}()
const Util = require('@Lib/Util')
const moment = require('moment')

class {{ controller_name }} extends BaseController {
  /**
   * 列表页
   */
  async list(ctx) {
    try {
      const resultValid = await listValid(ctx)
      if (resultValid) return resultValid

      const result = await {{ service_var }}.list(ctx)
      return result
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_list_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 获取列表
   */
  async getList(ctx) {
    try {
      const resultValid = await getListValid(ctx)
      if (resultValid) return resultValid

      const result = await {{ service_var }}.getList(ctx)
      if (result.data && result.data.list) {
        result.data.list = result.data.list.map(item => {
          // FORMAT_DATE_FIELDS
          return item
        })
      }
      return result
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_getList_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 创建页面
   */
  async create(ctx) {
    try {
      const resultValid = await createValid(ctx)
      if (resultValid) return resultValid

      const result = await {{ service_var }}.create(ctx)
      return result
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_create_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 创建数据
   */
  async createInfo(ctx) {
    try {
      const resultValid = await createInfoValid(ctx)
      if (resultValid) return resultValid

      const result = await {{ service_var }}.createInfo(ctx)
      return result
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_createInfo_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 查看数据
   */
  async view(ctx) {
    try {
      const resultValid = await viewValid(ctx)
      if (resultValid) return resultValid

      const result = await {{ service_var }}.view(ctx)
      if (result.data && result.data.info) {
        // FORMAT_DATE_FIELDS
      }
      return result
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_view_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 编辑页面
   */
  async edit(ctx) {
    try {
      const resultValid = await editValid(ctx)
      if (resultValid) return resultValid

      const result = await {{ service_var }}.edit(ctx)
      if (result.data && result.data.info) {
        // FORMAT_DATE_FIELDS
      }
      return result
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_edit_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 编辑数据
   */
  async editInfo(ctx) {
    try {
      const resultValid = await editInfoValid(ctx)
      if (resultValid) return resultValid

      const result = await {{ service_var }}.editInfo(ctx)
      return result
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_editInfo_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 删除数据
   */
  async remove(ctx) {
    try {
      const resultValid = await removeValid(ctx)
      if (resultValid) return resultValid

      const result = await {{ service_var }}.remove(ctx)
      return result
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_remove_' + Util.genRandomString(),
      })
    }
  }

  /**
   * 批量删除数据
   */
  async batchRemove(ctx) {
    try {
      const resultValid = await batchRemoveValid(ctx)
      if (resultValid) return resultValid

      const result = await {{ service_var }}.batchRemove(ctx)
      return result
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
