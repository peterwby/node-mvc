'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const moment = require('moment')
const RolesTable = require('@Table/roles')
const rolesTable = new RolesTable()
const log = use('Logger')

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
      let result = {}
      const { body } = ctx
      result = await rolesTable.fetchListBy(body)
      return Util.end({
        data: result.data,
      })
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

      const info = {
        ...result.data,
        id: result.data.role_id,
        role_name: result.data.name,
        created_at: moment(result.data.created_at).format('YYYY-MM-DD HH:mm:ss'),
        updated_at: moment(result.data.updated_at).format('YYYY-MM-DD HH:mm:ss'),
      }

      return Util.end({
        data: {
          title: '编辑roles',
          info: info,
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

      const info = {
        ...result.data,
        id: result.data.role_id,
        role_name: result.data.name,
        created_at: moment(result.data.created_at).format('YYYY-MM-DD HH:mm:ss'),
        updated_at: moment(result.data.updated_at).format('YYYY-MM-DD HH:mm:ss'),
      }

      return Util.end({
        data: {
          title: 'roles详情',
          info: info,
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
      result = await rolesTable.checkExistByColumn({ name: body.role_name })
      if (result.data.is_exist) {
        return Util.end({
          status: 0,
          msg: '无法新增，数据已存在',
        })
      }

      //开始创建新记录
      await Database.transaction(async (trx) => {
        result = await rolesTable.create(trx, {
          name: body.role_name,
          description: body.description,
        })
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
          where: [['role_id', '=', body.id]],
          set: { name: body.role_name, description: body.description },
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

  /**
   * 获取角色的权限列表
   * @param {Object} ctx - 上下文对象
   * @returns {Promise<Object>} 权限列表
   */
  async getPermissions(ctx) {
    try {
      const { params } = ctx
      const role_id = params.id

      // 检查角色是否存在
      const roleExists = await rolesTable.checkExistByColumn({ role_id })
      if (!roleExists.data.is_exist) {
        return Util.end({
          status: 0,
          msg: '角色不存在',
        })
      }

      // 获取角色的所有权限
      const permissions = await Database.table('role_permissions as rp')
        .select('p.*')
        .leftJoin('permissions as p', 'rp.permission_id', 'p.permission_id')
        .where('rp.role_id', role_id)
        .orderBy('p.key')

      // 获取所有可用权限
      const allPermissions = await Database.table('permissions').select('*').orderBy('key')

      // 构建权限树
      const permissionTree = this._buildPermissionTree(
        allPermissions,
        permissions.map((p) => p.permission_id)
      )

      return Util.end({
        data: {
          permissions: permissionTree,
        },
      })
    } catch (err) {
      log.error('获取角色权限失败:', {
        error: err.message,
        stack: err.stack,
        role_id: ctx.params.id,
      })
      return Util.error({
        msg: err.message,
        track: 'service_getPermissions_1739012356882',
      })
    }
  }

  /**
   * 保存角色的权限配置
   * @param {Object} ctx - 上下文对象
   * @returns {Promise<Object>} 保存结果
   */
  async savePermissions(ctx) {
    try {
      const { params, request } = ctx
      const role_id = params.id
      const { permission_ids = [] } = request.body

      // 检查角色是否存在
      const roleExists = await rolesTable.checkExistByColumn({ role_id })
      if (!roleExists.data.is_exist) {
        return Util.end({
          status: 0,
          msg: '角色不存在',
        })
      }

      // 检查权限ID是否都有效
      const validPermissions = await Database.table('permissions').whereIn('permission_id', permission_ids).pluck('permission_id')

      if (validPermissions.length !== permission_ids.length) {
        return Util.end({
          status: 0,
          msg: '存在无效的权限ID',
        })
      }

      // 开启事务
      await Database.transaction(async (trx) => {
        // 删除原有权限
        await trx.table('role_permissions').where('role_id', role_id).delete()

        // 批量插入新权限
        if (permission_ids.length > 0) {
          const insertData = permission_ids.map((permission_id) => ({
            role_id,
            permission_id,
          }))
          await trx.table('role_permissions').insert(insertData)
        }
      })

      return Util.end({
        msg: '保存成功',
      })
    } catch (err) {
      log.error('保存角色权限失败:', {
        error: err.message,
        stack: err.stack,
        role_id: ctx.params.id,
        permission_ids: ctx.request.body.permission_ids,
      })
      return Util.error({
        msg: err.message,
        track: 'service_savePermissions_1739012356882',
      })
    }
  }

  /**
   * 构建权限树
   * @private
   */
  _buildPermissionTree(allPermissions, selectedIds) {
    const permissionMap = {}
    const tree = []

    // 按URL路径分组
    allPermissions.forEach((permission) => {
      // 解析路径，例如 /admin/member/list -> admin
      // 或者 /api/member/get-list -> api
      const parts = permission.key.split('/')
      const module = parts[2] || 'other' // 取第2级路径作为模块名，如果没有则归类为other

      if (!permissionMap[module]) {
        permissionMap[module] = {
          id: module,
          text: module,
          children: [],
          state: {
            selected: false,
            opened: true,
          },
        }
        tree.push(permissionMap[module])
      }

      permissionMap[module].children.push({
        id: permission.permission_id,
        text: `[${permission.type}] ${permission.name}`,
        state: {
          selected: selectedIds.includes(permission.permission_id),
        },
      })
    })

    // 按模块名称排序
    tree.sort((a, b) => a.text.localeCompare(b.text))

    // 对每个模块的子节点按名称排序
    tree.forEach((module) => {
      module.children.sort((a, b) => a.text.localeCompare(b.text))
    })

    return tree
  }
}

module.exports = RolesService
