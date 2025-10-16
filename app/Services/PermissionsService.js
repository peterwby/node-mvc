'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const moment = require('dayjs')
const PermissionsTable = require('@Table/permissions')
const permissionsTable = new PermissionsTable()
const Route = use('Route')
const RolePermissionsTable = require('@Table/role_permissions')
const rolePermissionsTable = new RolePermissionsTable()

class PermissionsService extends BaseService {
  /**
   * 获取列表页面数据
   */
  async list(ctx) {
    try {
      return Util.end({
        data: {
          title: 'permissions管理',
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_list_1739012451430',
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
      result = await permissionsTable.fetchListBy(body)
      return Util.end({
        data: result.data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_getList_1739012451430',
      })
    }
  }

  /**
   * 获取创建页面数据
   */
  async create(ctx) {
    try {
      const type_list = ['menu', 'api', 'element']
      const data = {
        type_list,
      }
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_create_1739012451430',
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
      const result = await permissionsTable.fetchDetailById(id)
      if (result.status === 0) {
        return Util.end({
          msg: result.msg,
          status: result.status,
        })
      }

      const type_list = ['menu', 'api', 'element']

      const info = {
        ...result.data,
        id: result.data.permission_id,
        permission_name: result.data.name,
        created_at: moment(result.data.created_at).format('YYYY-MM-DD HH:mm:ss'),
        updated_at: moment(result.data.updated_at).format('YYYY-MM-DD HH:mm:ss'),
      }

      return Util.end({
        data: {
          title: '编辑permissions',
          type_list,
          info: info,
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_edit_1739012451430',
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
      const result = await permissionsTable.fetchDetailById(id)
      if (result.status === 0) {
        return Util.end({
          msg: result.msg,
          status: result.status,
        })
      }

      const info = {
        ...result.data,
        id: result.data.permission_id,
        permission_name: result.data.name,
        created_at: moment(result.data.created_at).format('YYYY-MM-DD HH:mm:ss'),
        updated_at: moment(result.data.updated_at).format('YYYY-MM-DD HH:mm:ss'),
      }

      return Util.end({
        data: {
          title: 'permissions详情',
          info: info,
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_view_1739012451430',
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
      result = await permissionsTable.checkExistByColumn({ name: body.name })
      if (result.data.is_exist) {
        return Util.end({
          status: 0,
          msg: '无法新增，数据已存在',
        })
      }
      //开始创建新记录
      await Database.transaction(async (trx) => {
        result = await permissionsTable.create(trx, body)
        if (result.status === 0) {
          throw new Error('新增失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_createInfo_1739012451430',
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
        result = await permissionsTable.updateBy(trx, {
          where: [['permission_id', '=', body.id]],
          set: { name: body.permission_name, key: body.key, description: body.description },
        })
        if (result.status === 0) {
          throw new Error('保存失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_updateInfo_1739012451430',
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
      // 如果要删除的权限id已被分配给角色，则不能删除
      const roleResult = await Database.table('role_permissions').whereIn('permission_id', body.ids).first()
      if (roleResult) {
        return Util.end({
          status: 0,
          msg: '无法删除，权限已被分配给角色',
        })
      }
      await Database.transaction(async (trx) => {
        result = await permissionsTable.deleteByIds(trx, body.ids)
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
        track: 'service_remove_1739012451430',
      })
    }
  }

  /**
   * 路由与权限差异预览（只读）
   * @param {Object} ctx
   */
  async previewImportFromRoutes(ctx) {
    try {
      const diff = await this._diffRoutesWithPermissions()
      return Util.end({
        data: {
          total: diff.candidates.length,
          exists_count: diff.exists.length,
          missing_count: diff.missing.length,
          missing: diff.missing,
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_previewImportFromRoutes_1739012451430',
      })
    }
  }

  /**
   * 从路由批量导入权限（仅导入缺失项），并分配给超级管理员
   * @param {Object} ctx
   */
  async importFromRoutes(ctx) {
    try {
      const { missing } = await this._diffRoutesWithPermissions()
      if (!missing.length) {
        return Util.end({
          msg: '无新增权限',
          data: { created: 0 },
        })
      }

      let created = 0
      const createdPermissionIds = []

      await Database.transaction(async (trx) => {
        // 1) 插入缺失的权限
        for (const perm of missing) {
          const res = await permissionsTable.create(trx, perm)
          if (res.status === 1 && res.data.new_id) {
            created++
            createdPermissionIds.push(res.data.new_id)
          }
        }

        // 2) 为超级管理员分配新增的权限
        for (const pid of createdPermissionIds) {
          await rolePermissionsTable.create(trx, {
            role_id: 1,
            permission_id: pid,
          })
        }
      })

      return Util.end({
        msg: `成功新增 ${created} 个权限`,
        data: { created },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_importFromRoutes_1739012451430',
      })
    }
  }

  /**
   * 计算路由与 permissions 的差异
   * @private
   */
  async _diffRoutesWithPermissions() {
    // 1) 提取候选路由
    const candidates = this._extractRouteCandidates()

    // 2) 查询已有权限 keys
    const rows = await Database.table('permissions').select('key')
    const existedSet = new Set(rows.map((x) => x.key))

    // 3) 计算差集
    const missing = candidates.filter((x) => !existedSet.has(x.key))
    const exists = candidates.filter((x) => existedSet.has(x.key))
    return { candidates, exists, missing }
  }

  /**
   * 从框架路由中抽取候选权限
   * @private
   */
  _extractRouteCandidates() {
    const whitelist = new Set([
      '/api/member/logout',
      '/api/get-translation',
      '/api/upload/image',
      '/api/member/update-password',
      '/api/member/sign-in',
      '/api/member/sign-up',
      '/admin/auth/sign-in',
      '/admin/auth/sign-up',
    ])

    const routeObjs = Route.list() || []
    const candidates = []

    for (const r of routeObjs) {
      // 兼容不同版本的 Route 实例结构
      let pattern = ''
      if (r && typeof r.toJSON === 'function') {
        const json = r.toJSON()
        pattern = json && (json.route || json.pattern || json.url) ? json.route || json.pattern || json.url : ''
      }
      if (!pattern && r && (r.route || r._route)) {
        pattern = r.route || r._route
      }
      if (!pattern) continue

      // 仅处理 /admin/** 与 /api/**
      if (!pattern.startsWith('/admin') && !pattern.startsWith('/api')) continue
      if (whitelist.has(pattern)) continue

      // 规范化 /admin 为 /admin/
      if (pattern === '/admin') pattern = '/admin/'

      const type = pattern.startsWith('/admin') ? 'menu' : 'api'
      candidates.push({
        name: pattern,
        type,
        key: pattern,
        description: `imported from route: ${pattern}`,
      })
    }

    return candidates
  }
}

module.exports = PermissionsService
