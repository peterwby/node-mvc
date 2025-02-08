'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const log = use('Logger')
const RolesTable = require('@Table/roles')
const rolesTable = new RolesTable()

class RolesService extends BaseService {
  /**
   * 获取列表页面数据
   */
  async list(ctx) {
    try {
      return Util.end({
        data: {
          title: 'roles管理',
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_list_1739012356882',
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

      if (filters.id) {
        where.push(['id', 'like', `%filters.id}%`])
      }

      if (filters.role_name) {
        where.push(['role_name', 'like', `%filters.role_name}%`])
      }

      // 查询数据
      const result = await rolesTable.fetchAll({
        where,
        page,
        limit,
      })

      return result
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_getList_1739012356882',
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
          title: '创建roles',
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_create_1739012356882',
      })
    }
  }

  /**
   * 获取编辑页面数据
   */
  async edit(ctx) {
    try {
      const { body } = ctx
      const { id } = body

      // 获取详情
      const result = await rolesTable.fetchDetailById(id)
      if (result.status === 0) {
        return Util.end({
          msg: result.msg,
          status: result.status,
        })
      }

      return Util.end({
        data: {
          title: '编辑roles',
          info: result.data,
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_edit_1739012356882',
      })
    }
  }

  /**
   * 获取详情页面数据
   */
  async view(ctx) {
    try {
      const { body } = ctx
      const { id } = body

      // 获取详情
      const result = await rolesTable.fetchDetailById(id)
      if (result.status === 0) {
        return Util.end({
          msg: result.msg,
          status: result.status,
        })
      }

      return Util.end({
        data: {
          title: 'roles详情',
          info: result.data,
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_view_1739012356882',
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
      result = await rolesTable.checkExistByColumn({ id: body.id })
      if (result.data.is_exist) {
        return Util.end({
          status: 0,
          msg: '无法新增，数据已存在',
        })
      }
      //开始创建新记录
      await Database.transaction(async (trx) => {
        result = await rolesTable.create(trx, body)
        if (result.status === 0) {
          throw new Error('新增失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_createInfo_1739012356882',
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
        result = await rolesTable.updateBy(trx, {
          where: [],
          set: {},
        })
        if (result.status === 0) {
          throw new Error('保存失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_updateInfo_1739012356882',
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
        result = await rolesTable.deleteByIds(trx, body.ids)
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
        track: 'service_remove_1739012356882',
      })
    }
  }
}

module.exports = RolesService
