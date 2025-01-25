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
   * 获取菜单树
   * @returns {Promise<{data: *}>}
   */
  async getMenuTree() {
    try {
      // 1. 尝试从 Redis 获取缓存
      const cacheKey = 'admin:menu:tree'
      let menuTree = await Redis.get(cacheKey)
      if (menuTree) {
        return Util.end({
          data: JSON.parse(menuTree),
        })
      }

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
      const tree = []

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

      // 4. 缓存结果到 Redis，设置 15 分钟过期
      await Redis.set(cacheKey, JSON.stringify(tree), 'EX', 900)

      return Util.end({
        data: tree,
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
