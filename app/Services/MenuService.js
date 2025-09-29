'use strict'

const Database = use('Database')
const log = use('Logger')
const Env = use('Env')
const Helpers = use('Helpers')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const PrimaryMenusTable = require('@Table/primary_menus')
const primaryMenusTable = new PrimaryMenusTable()
const Redis = use('Redis')

class MenuService extends BaseService {
  constructor(props) {
    super(props)
  }

  /**
   * 清除菜单缓存
   * @returns {Promise<void>}
   */
  async clearMenuCache() {
    try {
      const cacheKey = 'admin:menu:tree'
      await Redis.del(cacheKey)
      return Util.end({
        msg: '清除菜单缓存成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_clearMenuCache_' + Date.now(),
      })
    }
  }

  /**
   * 检查菜单节点是否有权限访问
   * @param {Object} menu 菜单节点
   * @param {Object} permissions 权限对象
   * @returns {boolean}
   */
  checkMenuPermission(menu, permissions) {
    // 如果菜单没有设置权限key，则默认允许访问
    if (!menu.permission_key) {
      return true
    }
    // 检查是否有权限访问
    return Util.checkPermission(menu.permission_key, permissions)
  }

  /**
   * 过滤菜单树
   * 如果一个节点的所有子节点都被过滤掉了，且自己也没有权限，则过滤掉该节点
   * 如果一个节点有权限的子节点，即使自己没有权限也要保留，以维持菜单结构
   * @param {Array} tree 菜单树
   * @param {Object} permissions 权限对象
   * @returns {Array} 过滤后的菜单树
   */
  filterMenuTree(tree, permissions) {
    return tree.filter((node) => {
      // 1. 递归处理子节点
      if (node.children && node.children.length > 0) {
        node.children = this.filterMenuTree(node.children, permissions)
      }

      // 2. 判断当前节点是否应该保留
      // - 如果有权限的子节点，保留当前节点
      // - 如果自己有权限，保留当前节点
      // - 否则过滤掉
      return (node.children && node.children.length > 0) || this.checkMenuPermission(node, permissions)
    })
  }

  /**
   * 获取菜单树
   * @param {Object} permissions 权限对象
   * @returns {Promise<{data: *}>}
   */
  async getMenuTree(permissions = {}) {
    try {
      // 1. 尝试从 Redis 获取缓存
      const cacheKey = 'admin:menu:tree'
      let menuTree = await Redis.get(cacheKey)
      let tree = []

      if (menuTree) {
        tree = JSON.parse(menuTree)
      } else {
        // 2. 如果没有缓存，从数据库获取
        const result = await primaryMenusTable.fetchAll({
          where: [['status', '=', 1]],
          orderBy: [
            ['level', 'asc'],
            ['sort', 'asc'],
          ],
        })

        if (result.status <= 0) {
          throw new Error(result.msg || '获取菜单数据失败')
        }

        const menuList = result.data.data

        // 3. 构建树形结构
        const menuMap = new Map()
        tree = []

        // 3.1 第一次遍历建立映射关系
        menuList.forEach((menu) => {
          menuMap.set(menu.id, {
            ...menu,
            children: [],
          })
        })

        // 3.2 第二次遍历构建树
        menuList.forEach((menu) => {
          const menuNode = menuMap.get(menu.id)
          if (menu.parent_id === 0) {
            tree.push(menuNode)
          } else {
            const parent = menuMap.get(menu.parent_id)
            if (parent) {
              // 只要找到父节点就添加，不需要判断 is_leaf
              parent.children.push(menuNode)
            }
          }
        })

        // 4. 缓存原始菜单树到 Redis，设置 1 分钟过期
        await Redis.set(cacheKey, JSON.stringify(tree), 'EX', 60)
      }

      // 5. 根据权限过滤菜单树
      const filteredTree = this.filterMenuTree(tree, permissions)

      return Util.end({
        data: filteredTree,
      })
    } catch (err) {
      console.log(err)
      console.log('service_getMenuTree_1737816859881')
      return Util.end({
        status: -1,
        msg: err.message,
        data: [],
      })
    }
  }
}

module.exports = MenuService
