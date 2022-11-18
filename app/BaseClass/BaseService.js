'use strict'
const Redis = use('Redis')
const Util = require('@Lib/Util')
const crypto = require('crypto')

class BaseService {
  constructor(obj = {}) {}
  /**
   * basic cache
   *
   */
  async cache(key, func, params, expire = 1) {
    if (typeof func !== 'function') {
      throw new Error('func param is required')
    }

    // check expire
    if (!expire || !Util.isNumber(expire) || parseInt(expire) < 0) {
      expire = 0
    }
    if (parseInt(expire) === 0) {
      // no cache
      let result = await func.call(this, ctx)
      return result
    }

    let value = await Redis.get(`cache_${key}`)
    if (value) {
      return JSON.parse(value)
    }
    let result = await func.call(this, params)
    await Redis.set(`cache_${key}`, JSON.stringify(result), 'EX', expire)
    return result
  }

  /**
   * global cache
   * expire: if 0 then no cache, other values ​​mean N seconds
   */
  async cacheCommon(func, ctx, expire = 1) {
    try {
      if (typeof func !== 'function') {
        throw new Error('func param is required')
      }

      // check expire
      if (!expire || !Util.isNumber(expire) || parseInt(expire) < 0) {
        expire = 0
      }
      if (parseInt(expire) === 0) {
        // console.log('cacheCommon: skip cache')
        // no cache
        let result = await func.call(this, ctx)
        return result
      }

      let url = ctx.request.url()
      let requestAll = JSON.stringify(ctx.request.all())
      let originStr = url + '#' + requestAll
      let key = crypto.createHash('md5').update(originStr).digest('hex').toLowerCase()
      let value = await Redis.get(`cache_${key}`)
      if (value) {
        // console.log('cacheCommon: has cache')
        return JSON.parse(value)
      }
      // console.log('cacheCommon: no cache')
      let result = await func.call(this, ctx)
      await Redis.set(`cache_${key}`, JSON.stringify(result), 'EX', expire)
      return result
    } catch (e) {
      console.log(e.message)
      return await func.call(this, ctx)
    }
  }

  /**
   * personal cache
   * expire: if 0 then no cache, other values ​​mean N seconds
   */
  async cacheMember(func, ctx, expire = 1) {
    try {
      if (typeof func !== 'function') {
        throw new Error('func param is required')
      }
      let memberInfo = ctx.session.get('member')
      if (!memberInfo || !memberInfo.member_id) {
        throw new Error('cacheMember: not found session')
      }

      // check expire
      if (!expire || !Util.isNumber(expire) || parseInt(expire) < 0) {
        expire = 0
      }
      if (parseInt(expire) === 0) {
        // console.log('cacheMember: no cache')
        // no cache
        let result = await func.call(this, ctx)
        return result
      }

      let url = ctx.request.url()
      let requestAll = JSON.stringify(ctx.request.all())
      let originStr = url + '#' + requestAll + '#' + memberInfo.member_id
      let key = crypto.createHash('md5').update(originStr).digest('hex').toLowerCase()
      let value = await Redis.get(`cache_${key}`)
      if (value) {
        // console.log('cacheMember: has cache')
        return JSON.parse(value)
      }
      let result = await func.call(this, ctx)
      await Redis.set(`cache_${key}`, JSON.stringify(result), 'EX', expire)
      return result
    } catch (e) {
      console.log(e.message)
      return await func.call(this, ctx)
    }
  }
}

module.exports = BaseService
