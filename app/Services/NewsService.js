'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const log = use('Logger')
const NewsTable = require('@Table/news')
const newsTable = new NewsTable()

class NewsService extends BaseService {
  /**
   * 获取列表页面数据
   */
  async list(ctx) {
    try {
      return Util.end({
        data: {
          title: 'news管理'
        }
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_list_1738766554641'
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
        
      
        
          if (filters.title) {
            
              where.push(['title', 'like', `%filters.title}%`])
            
          }
        
      
        
          if (filters.content) {
            
              where.push(['content', 'like', `%filters.content}%`])
            
          }
        
      

      // 查询数据
      const result = await newsTable.fetchAll({
        where,
        page,
        limit
      })

      return result
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_getList_1738766554641'
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
          title: '创建news'
        }
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_create_1738766554641'
      })
    }
  }

  /**
   * 获取编辑页面数据
   */
  async edit(ctx) {
    try {
      const { query } = ctx
      const { id } = query

      // 获取详情
      const result = await newsTable.fetchDetailById(id)
      if (result.status === 0) {
        return Util.end({
          msg: result.msg,
          status: result.status
        })
      }

      return Util.end({
        data: {
          title: '编辑news',
          info: result.data
        }
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_edit_1738766554641'
      })
    }
  }

  /**
   * 获取详情页面数据
   */
  async view(ctx) {
    try {
      const { query } = ctx
      const { id } = query

      // 获取详情
      const result = await newsTable.fetchDetailById(id)
      if (result.status === 0) {
        return Util.end({
          msg: result.msg,
          status: result.status
        })
      }

      return Util.end({
        data: {
          title: 'news详情',
          info: result.data
        }
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_view_1738766554641'
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
      result = await newsTable.checkExistByColumn({ id: body.id })
      if (result.data.is_exist) {
        return Util.end({
          status: 0,
          msg: '无法新增，数据已存在',
        })
      }
      //开始创建新记录
      await Database.transaction(async (trx) => {
        result = await newsTable.create(trx, body)
        if (result.status === 0) {
          throw new Error('新增失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_createInfo_1738766554641'
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
        result = await newsTable.updateBy(trx, {
          where: [],
          set: { },
        })
        if (result.status === 0) {
          throw new Error('保存失败')
        }
      })

      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'service_updateInfo_1738766554641'
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
        result = await newsTable.deleteByIds(trx, body.ids)
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
        track: 'service_remove_1738766554641'
      })
    }
  }
}

module.exports = NewsService
