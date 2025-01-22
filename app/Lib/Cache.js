'use strict'

/**
 * 全局缓存管理类
 */
class Cache {
  constructor(options = {}) {
    this._store = {}
    this._maxItems = options.maxItems || 1000 // 最大缓存项数
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键名
   * @param {any} value - 缓存值，支持任何JavaScript类型（对象、数组、字符串、数字等）
   * @param {string} [command] - 可选，设置过期时间的命令，目前只支持 'EX'。不设置则永久有效
   * @param {number} [ttl] - 可选，过期时间（秒）
   * @returns {boolean} - 是否设置成功
   */
  set(key, value, command, ttl) {
    try {
      // 检查参数
      if (typeof key !== 'string') {
        throw new Error('Cache key must be a string')
      }

      // 清理过期项并检查容量
      this._cleanupIfNeeded()

      const cacheItem = {
        value,
        createTime: Date.now(),
      }

      if (command === 'EX' && ttl) {
        if (!Number.isInteger(ttl) || ttl <= 0) {
          throw new Error('TTL must be a positive integer')
        }
        cacheItem.expireTime = Date.now() + ttl * 1000
      }

      this._store[key] = cacheItem
      return true
    } catch (err) {
      console.error('Cache set error:', err.message)
      return false
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键名
   * @returns {any} - 缓存值，如果不存在或已过期则返回null
   */
  get(key) {
    try {
      if (typeof key !== 'string') {
        throw new Error('Cache key must be a string')
      }

      const item = this._store[key]
      if (!item) {
        return null
      }

      // 检查是否过期
      if (item.expireTime && item.expireTime < Date.now()) {
        this.del(key)
        return null
      }

      return item.value
    } catch (err) {
      console.error('Cache get error:', err.message)
      return null
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键名
   * @returns {boolean} - 是否删除成功
   */
  del(key) {
    try {
      if (typeof key !== 'string') {
        throw new Error('Cache key must be a string')
      }
      delete this._store[key]
      return true
    } catch (err) {
      console.error('Cache del error:', err.message)
      return false
    }
  }

  /**
   * 清空所有缓存
   * @returns {boolean} - 是否清空成功
   */
  clear() {
    try {
      this._store = {}
      return true
    } catch (err) {
      console.error('Cache clear error:', err.message)
      return false
    }
  }

  /**
   * 获取缓存数量
   * @returns {number} - 缓存项数量
   */
  size() {
    this._cleanupIfNeeded() // 返回大小前先清理过期项
    return Object.keys(this._store).length
  }

  /**
   * 清理过期项并检查容量限制
   * @private
   */
  _cleanupIfNeeded() {
    const now = Date.now()
    let keys = Object.keys(this._store)

    // 清理过期项
    keys.forEach((key) => {
      const item = this._store[key]
      if (item.expireTime && item.expireTime < now) {
        this.del(key)
      }
    })

    // 重新获取清理后的 keys
    keys = Object.keys(this._store)

    // 如果仍然超过容量限制，删除最旧的项
    while (keys.length >= this._maxItems) {
      this._removeOldest()
      keys = Object.keys(this._store) // 更新 keys
    }
  }

  /**
   * 移除最旧的缓存项
   * @private
   */
  _removeOldest() {
    let oldestKey = null
    let oldestTime = Infinity

    Object.entries(this._store).forEach(([key, item]) => {
      if (item.createTime < oldestTime) {
        oldestKey = key
        oldestTime = item.createTime
      }
    })

    if (oldestKey) {
      this.del(oldestKey)
    }
  }
}

// 导出单例
module.exports = new Cache()
