'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const moment = require('dayjs')
const Redis = use('Redis')
const NoticesTable = require('@Table/notices')
const noticesTable = new NoticesTable()

class NoticeService extends BaseService {
  /**
   * 获取公告列表
   */
  async getList(ctx) {
    try {
      const { body } = ctx
      const result = await noticesTable.fetchListBy(body)
      return Util.end({
        data: result.data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getList_1739012356882',
      })
    }
  }

  /**
   * 创建公告
   */
  async create(ctx) {
    try {
      const { body } = ctx
      const member_info = ctx.session.get('member')

      const noticeData = {
        title: body.title,
        content: body.content,
        type: body.type || 'info',
        status: body.status !== undefined ? parseInt(body.status) : 1,
        is_top: body.is_top !== undefined ? parseInt(body.is_top) : 0,
        publish_time: body.publish_time || moment().format('YYYY-MM-DD HH:mm:ss'),
        expire_time: body.expire_time || null,
        publish_by: member_info.member_id,
      }

      await Database.transaction(async (trx) => {
        const result = await noticesTable.create(trx, noticeData)
        if (result.status === 0) {
          throw new Error(result.msg || '创建失败')
        }
      })

      // 清除Dashboard统计缓存
      await this.clearDashboardCache()

      return Util.end({
        msg: '创建成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_create_1739012356882',
      })
    }
  }

  /**
   * 更新公告
   */
  async update(ctx) {
    try {
      const { body } = ctx
      const notice_id = body.notice_id || body.id

      if (!notice_id) {
        return Util.end({
          status: 0,
          msg: '公告ID不能为空',
        })
      }

      const updateData = {}
      if (body.title !== undefined) {
        updateData.title = body.title
      }
      if (body.content !== undefined) {
        updateData.content = body.content
      }
      if (body.type !== undefined) {
        updateData.type = body.type
      }
      if (body.status !== undefined) {
        updateData.status = parseInt(body.status)
      }
      if (body.is_top !== undefined) {
        updateData.is_top = parseInt(body.is_top)
      }
      if (body.publish_time !== undefined) {
        updateData.publish_time = body.publish_time || null
      }
      if (body.expire_time !== undefined) {
        updateData.expire_time = body.expire_time || null
      }

      await Database.transaction(async (trx) => {
        const result = await noticesTable.updateBy(trx, {
          where: [['notice_id', '=', notice_id]],
          set: updateData,
        })
        if (result.status === 0) {
          throw new Error(result.msg || '更新失败')
        }
      })

      // 清除Dashboard统计缓存
      await this.clearDashboardCache()

      return Util.end({
        msg: '更新成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_update_1739012356882',
      })
    }
  }

  /**
   * 删除公告
   */
  async remove(ctx) {
    try {
      const { body } = ctx
      const notice_ids = body.ids || []

      if (!Array.isArray(notice_ids) || notice_ids.length === 0) {
        return Util.end({
          status: 0,
          msg: '请选择要删除的公告',
        })
      }

      await Database.transaction(async (trx) => {
        const result = await noticesTable.deleteByIds(trx, notice_ids)
        if (result.status === 0) {
          throw new Error(result.msg || '删除失败')
        }
      })

      // 清除Dashboard统计缓存
      await this.clearDashboardCache()

      return Util.end({
        msg: '删除成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_remove_1739012356882',
      })
    }
  }

  /**
   * 清除Dashboard统计缓存
   */
  async clearDashboardCache() {
    try {
      const Redis = use('Redis')
      await Redis.del('dashboard:statistics')
      await Redis.del('dashboard:recent_activities')
    } catch (err) {
      // 清除缓存失败不影响主流程，只记录日志
      console.error('清除Dashboard缓存失败:', err.message)
    }
  }

  /**
   * 获取有效公告（用于前台展示）
   */
  async getActiveNotices() {
    try {
      const result = await noticesTable.getActiveNotices()
      return result
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getActiveNotices_1739012356882',
      })
    }
  }
}

module.exports = NoticeService
