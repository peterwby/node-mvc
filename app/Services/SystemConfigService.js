'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const Redis = use('Redis')
const SystemConfigTable = require('@Table/system_config')
const systemConfigTable = new SystemConfigTable()

class SystemConfigService extends BaseService {
  /**
   * 获取单个配置（带缓存）
   * @param {string} key 配置键名
   */
  async getConfig(key) {
    try {
      // 先尝试从Redis获取
      const cacheKey = `system:config:${key}`
      const cached = await Redis.get(cacheKey)
      if (cached) {
        return Util.end({
          data: JSON.parse(cached),
        })
      }

      // 从数据库获取
      const result = await systemConfigTable.getByKey(key)
      if (result.status > 0 && result.data) {
        // 缓存到Redis，过期时间1小时
        await Redis.set(cacheKey, JSON.stringify(result.data), 'EX', 3600)
      }
      return result
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getConfig_1739012356882',
      })
    }
  }

  /**
   * 获取所有配置（带缓存）
   */
  async getAllConfigs() {
    try {
      // 先尝试从Redis获取
      const cacheKey = 'system:config:all'
      const cached = await Redis.get(cacheKey)
      if (cached) {
        return Util.end({
          data: JSON.parse(cached),
        })
      }

      // 从数据库获取
      const result = await systemConfigTable.getAllConfigs()
      if (result.status > 0) {
        // 转换为对象格式，方便使用
        const configObj = {}
        result.data.forEach((item) => {
          configObj[item.config_key] = item.config_value
        })

        // 缓存到Redis，过期时间1小时
        await Redis.set(cacheKey, JSON.stringify(configObj), 'EX', 3600)
        return Util.end({
          data: configObj,
        })
      }
      return result
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getAllConfigs_1739012356882',
      })
    }
  }

  /**
   * 按分组获取配置
   * @param {string} group 配置分组
   */
  async getConfigsByGroup(group) {
    try {
      const result = await systemConfigTable.getByGroup(group)
      return result
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getConfigsByGroup_1739012356882',
      })
    }
  }

  /**
   * 更新单个配置
   * @param {string} key 配置键名
   * @param {string} value 配置值
   */
  async updateConfig(key, value) {
    try {
      await Database.transaction(async (trx) => {
        const result = await systemConfigTable.updateByKey(key, value)
        if (result.status <= 0) {
          throw new Error(result.msg || '更新失败')
        }
      })

      // 清除相关缓存
      await this.clearCache(key)

      return Util.end({
        msg: '更新成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_updateConfig_1739012356882',
      })
    }
  }

  /**
   * 批量更新配置
   * @param {Object} configs 配置对象 {key1: value1, key2: value2}
   */
  async batchUpdateConfigs(configs) {
    try {
      await Database.transaction(async (trx) => {
        for (const [key, value] of Object.entries(configs)) {
          const result = await systemConfigTable.updateByKey(key, value)
          if (result.status <= 0) {
            throw new Error(`更新配置 ${key} 失败`)
          }
        }
      })

      // 清除所有配置缓存
      await this.clearCache()

      return Util.end({
        msg: '批量更新成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_batchUpdateConfigs_1739012356882',
      })
    }
  }

  /**
   * 清除配置缓存
   * @param {string} key 配置键名，如果不提供则清除所有配置缓存
   */
  async clearCache(key = null) {
    try {
      if (key) {
        // 清除单个配置缓存和全部缓存
        await Redis.del(`system:config:${key}`)
        await Redis.del('system:config:all')
      } else {
        // 清除所有配置相关缓存
        const keys = await Redis.keys('system:config:*')
        if (keys.length > 0) {
          await Redis.del(...keys)
        }
      }
      return Util.end({})
    } catch (err) {
      // 缓存清除失败不影响主流程
      console.log('清除缓存失败:', err.message)
      return Util.end({})
    }
  }

  /**
   * 获取配置列表（用于管理页面）
   */
  async getList(ctx) {
    try {
      const result = await systemConfigTable.getAllConfigs()
      return Util.end({
        data: result.data || [],
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getList_1739012356882',
      })
    }
  }
}

module.exports = SystemConfigService

