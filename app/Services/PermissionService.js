'use strict'

const Database = use('Database')
const log = use('Logger')
const Env = use('Env')
const Helpers = use('Helpers')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')

// 引入表文件
const PermissionsTable = require('@Table/permissions')
const RolesTable = require('@Table/roles')
const MemberRolesTable = require('@Table/member_roles')
const RolePermissionsTable = require('@Table/role_permissions')

// 实例化表对象
const permissionsTable = new PermissionsTable()
const rolesTable = new RolesTable()
const memberRolesTable = new MemberRolesTable()
const rolePermissionsTable = new RolePermissionsTable()

class PermissionService extends BaseService {
  constructor(props) {
    super(props)
  }

  /**
   * 获取用户所有权限
   */
  async getUserPermissions(ctx) {
    try {
      const { body } = ctx
      const { member_id } = body

      // 超级管理员直接返回所有权限
      if (member_id === 1) {
        const allPerms = await Database.select('*').from('permissions')
        const permMap = {}
        allPerms.forEach((perm) => {
          permMap[perm.key] = perm
        })
        return Util.end({ data: permMap })
      }

      // 普通用户查询其角色对应的权限
      const perms = await Database.table('permissions as p')
        .innerJoin('role_permissions as rp', 'p.permission_id', 'rp.permission_id')
        .innerJoin('member_roles as mr', 'rp.role_id', 'mr.role_id')
        .where('mr.member_id', member_id)
        .select('p.*')

      const permMap = {}
      perms.forEach((perm) => {
        permMap[perm.key] = perm
      })
      return Util.end({ data: permMap })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: `service_getUserPermissions_1738044135474`,
      })
    }
  }

  /**
   * 同步菜单权限
   */
  async syncMenuPermissions(ctx) {
    try {
      const { body } = ctx
      const { menu } = body

      await Database.transaction(async (trx) => {
        // 检查权限是否已存在
        const exists = await Database.select('*').from('permissions').where('key', menu.url).first()

        if (!exists) {
          // 插入菜单权限
          await permissionsTable.create(trx, {
            name: menu.name,
            type: 'menu',
            key: menu.url,
            description: `Menu: ${menu.name}`,
          })
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: `service_syncMenuPermissions_1738044145581`,
      })
    }
  }

  /**
   * 获取角色的所有权限
   */
  async getRolePermissions(ctx) {
    try {
      const { body } = ctx
      const { role_id } = body

      const perms = await Database.table('permissions as p')
        .innerJoin('role_permissions as rp', 'p.permission_id', 'rp.permission_id')
        .where('rp.role_id', role_id)
        .select('p.*')

      return Util.end({ data: perms })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: `service_getRolePermissions_1738044154966`,
      })
    }
  }

  /**
   * 为角色分配权限
   */
  async assignPermissionsToRole(ctx) {
    try {
      const { body } = ctx
      const { role_id, permission_ids } = body

      await Database.transaction(async (trx) => {
        // 先删除该角色的所有权限
        await rolePermissionsTable.deleteBy(trx, {
          where: [['role_id', '=', role_id]],
        })

        // 批量插入新的权限
        const insertData = permission_ids.map((permission_id) => ({
          role_id,
          permission_id,
        }))
        await rolePermissionsTable.createMany(trx, insertData)
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: `service_assignPermissionsToRole_1738044163626`,
      })
    }
  }
}

module.exports = PermissionService
