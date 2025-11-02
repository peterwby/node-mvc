'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const moment = require('dayjs')
const Redis = use('Redis')

class DashboardService extends BaseService {
  /**
   * 获取统计数据（带Redis缓存）
   */
  async getStatistics() {
    try {
      const cacheKey = 'dashboard:statistics'
      const cacheExpire = 300 // 5分钟过期

      // 先尝试从 Redis 获取缓存
      const cached = await Redis.get(cacheKey)
      if (cached) {
        return Util.end({
          data: JSON.parse(cached),
        })
      }

      // 缓存未命中，查询数据库
      // 会员统计
      const memberStats = await this.getMemberStatistics()

      // 文件统计
      const fileStats = await this.getFileStatistics()

      // 公告统计
      const noticeStats = await this.getNoticeStatistics()

      // 角色和权限统计
      const roleStats = await this.getRoleStatistics()

      // 最近活动（缓存时间更短）
      const recentActivitiesCacheKey = 'dashboard:recent_activities'
      let recentActivities = null
      const recentActivitiesCached = await Redis.get(recentActivitiesCacheKey)
      if (recentActivitiesCached) {
        recentActivities = JSON.parse(recentActivitiesCached)
      } else {
        recentActivities = await this.getRecentActivities()
        // 最近活动缓存2分钟（实时性要求稍高）
        await Redis.set(recentActivitiesCacheKey, JSON.stringify(recentActivities), 'EX', 120)
      }

      const data = {
        member: memberStats,
        file: fileStats,
        notice: noticeStats,
        role: roleStats,
        recent_activities: recentActivities,
      }

      // 缓存主要统计数据，5分钟过期
      await Redis.set(cacheKey, JSON.stringify(data), 'EX', cacheExpire)

      return Util.end({
        data: data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getStatistics_1739012356882',
      })
    }
  }

  /**
   * 清除统计数据缓存
   */
  async clearCache() {
    try {
      const Redis = use('Redis')
      await Redis.del('dashboard:statistics')
      await Redis.del('dashboard:recent_activities')
      return Util.end({
        msg: '缓存已清除',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_clearCache_1739012356882',
      })
    }
  }

  /**
   * 获取会员统计
   */
  async getMemberStatistics() {
    try {
      const today = moment().format('YYYY-MM-DD 00:00:00')
      const thisMonth = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss')

      // 总会员数
      const totalResult = await Database.from('member').count('* as count')
      const total = totalResult[0].count || 0

      // 今日新增
      const todayResult = await Database.from('member').where('created_at', '>=', today).count('* as count')
      const todayNew = todayResult[0].count || 0

      // 本月新增
      const monthResult = await Database.from('member').where('created_at', '>=', thisMonth).count('* as count')
      const monthNew = monthResult[0].count || 0

      // 活跃会员（状态为启用）
      const activeResult = await Database.from('member').where('member_status_id', 1).count('* as count')
      const active = activeResult[0].count || 0

      return {
        total: parseInt(total),
        today_new: parseInt(todayNew),
        month_new: parseInt(monthNew),
        active: parseInt(active),
      }
    } catch (err) {
      console.error('获取会员统计失败:', err)
      return {
        total: 0,
        today_new: 0,
        month_new: 0,
        active: 0,
      }
    }
  }

  /**
   * 获取文件统计
   */
  async getFileStatistics() {
    try {
      // 总文件数
      const totalResult = await Database.from('files').count('* as count')
      const total = totalResult[0].count || 0

      // 按类型统计
      const categoryStats = await Database.from('files').select('category').count('* as count').groupBy('category')

      const categoryMap = {}
      let totalSize = 0

      categoryStats.forEach((item) => {
        categoryMap[item.category] = parseInt(item.count)
      })

      // 总存储空间（字节）
      const sizeResult = await Database.from('files').sum('file_size as total_size')
      totalSize = sizeResult[0].total_size || 0

      // 今日上传
      const today = moment().format('YYYY-MM-DD 00:00:00')
      const todayResult = await Database.from('files').where('created_at', '>=', today).count('* as count')
      const todayNew = todayResult[0].count || 0

      return {
        total: parseInt(total),
        today_new: parseInt(todayNew),
        total_size: parseInt(totalSize),
        by_category: {
          image: categoryMap.image || 0,
          document: categoryMap.document || 0,
          video: categoryMap.video || 0,
          audio: categoryMap.audio || 0,
          other: categoryMap.other || 0,
        },
      }
    } catch (err) {
      console.error('获取文件统计失败:', err)
      return {
        total: 0,
        today_new: 0,
        total_size: 0,
        by_category: {
          image: 0,
          document: 0,
          video: 0,
          audio: 0,
          other: 0,
        },
      }
    }
  }

  /**
   * 获取公告统计
   */
  async getNoticeStatistics() {
    try {
      // 总公告数
      const totalResult = await Database.from('notices').count('* as count')
      const total = totalResult[0].count || 0

      // 已发布
      const publishedResult = await Database.from('notices').where('status', 1).count('* as count')
      const published = publishedResult[0].count || 0

      // 未发布
      const unpublishedResult = await Database.from('notices').where('status', 0).count('* as count')
      const unpublished = unpublishedResult[0].count || 0

      // 置顶公告
      const topResult = await Database.from('notices').where('is_top', 1).count('* as count')
      const top = topResult[0].count || 0

      // 今日发布
      const today = moment().format('YYYY-MM-DD 00:00:00')
      const todayResult = await Database.from('notices').where('publish_time', '>=', today).count('* as count')
      const todayNew = todayResult[0].count || 0

      return {
        total: parseInt(total),
        published: parseInt(published),
        unpublished: parseInt(unpublished),
        top: parseInt(top),
        today_new: parseInt(todayNew),
      }
    } catch (err) {
      console.error('获取公告统计失败:', err)
      return {
        total: 0,
        published: 0,
        unpublished: 0,
        top: 0,
        today_new: 0,
      }
    }
  }

  /**
   * 获取角色和权限统计
   */
  async getRoleStatistics() {
    try {
      // 角色总数
      const roleResult = await Database.from('roles').count('* as count')
      const roleTotal = roleResult[0].count || 0

      // 权限总数
      const permissionResult = await Database.from('permissions').count('* as count')
      const permissionTotal = permissionResult[0].count || 0

      // 按类型统计权限
      const permissionTypeResult = await Database.from('permissions').select('type').count('* as count').groupBy('type')

      const permissionTypeMap = {}
      permissionTypeResult.forEach((item) => {
        permissionTypeMap[item.type] = parseInt(item.count)
      })

      return {
        role_total: parseInt(roleTotal),
        permission_total: parseInt(permissionTotal),
        permission_by_type: {
          menu: permissionTypeMap.menu || 0,
          element: permissionTypeMap.element || 0,
          api: permissionTypeMap.api || 0,
        },
      }
    } catch (err) {
      console.error('获取角色统计失败:', err)
      return {
        role_total: 0,
        permission_total: 0,
        permission_by_type: {
          menu: 0,
          element: 0,
          api: 0,
        },
      }
    }
  }

  /**
   * 获取最近活动
   */
  async getRecentActivities() {
    try {
      const activities = []

      // 最近新增的会员（5条）
      const recentMembers = await Database.from('member').select('member_id', 'nickname', 'username', 'created_at').orderBy('created_at', 'desc').limit(5)

      recentMembers.forEach((member) => {
        activities.push({
          type: 'member',
          title: '新会员注册',
          content: member.nickname || member.username,
          time: member.created_at,
        })
      })

      // 最近上传的文件（5条）
      const recentFiles = await Database.from('files').select('file_id', 'file_name', 'created_at').orderBy('created_at', 'desc').limit(5)

      recentFiles.forEach((file) => {
        activities.push({
          type: 'file',
          title: '文件上传',
          content: file.file_name,
          time: file.created_at,
        })
      })

      // 最近发布的公告（5条）
      const recentNotices = await Database.from('notices')
        .select('notice_id', 'title', 'publish_time')
        .where('status', 1)
        .orderBy('publish_time', 'desc')
        .limit(5)

      recentNotices.forEach((notice) => {
        activities.push({
          type: 'notice',
          title: '公告发布',
          content: notice.title,
          time: notice.publish_time,
        })
      })

      // 按时间排序，取最新的10条
      activities.sort((a, b) => {
        return new Date(b.time) - new Date(a.time)
      })

      return activities.slice(0, 10).map((activity) => {
        return {
          ...activity,
          time: activity.time ? moment(activity.time).format('YYYY-MM-DD HH:mm:ss') : '',
        }
      })
    } catch (err) {
      console.error('获取最近活动失败:', err)
      return []
    }
  }
}

module.exports = DashboardService
