'use strict'

const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const Helpers = use('Helpers')
const Redis = use('Redis')
const FilesTable = require('@Table/files')
const filesTable = new FilesTable()
const fs = require('fs').promises
const path = require('path')

class FileService extends BaseService {
  /**
   * 获取文件分类
   */
  getCategoryByMimeType(mimeType) {
    if (!mimeType) return 'other'

    if (mimeType.startsWith('image/')) {
      return 'image'
    } else if (mimeType.startsWith('video/')) {
      return 'video'
    } else if (mimeType.startsWith('audio/')) {
      return 'audio'
    } else if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text') ||
      mimeType.includes('msword') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation')
    ) {
      return 'document'
    }
    return 'other'
  }

  /**
   * 上传文件
   */
  async uploadFile(ctx) {
    try {
      if (!ctx.file) {
        return Util.end({
          status: 0,
          msg: '请上传文件',
        })
      }

      const member_info = ctx.session.get('member')
      const file = ctx.file

      // 获取系统配置的文件大小限制
      const SystemConfigService = require('@Services/SystemConfigService')
      const systemConfigService = new SystemConfigService()
      const maxSizeResult = await systemConfigService.getConfig('upload_max_size')
      const maxSize = maxSizeResult.status > 0 && maxSizeResult.data ? parseInt(maxSizeResult.data.config_value) : 10 * 1024 * 1024 // 默认10MB

      // 检查文件大小
      if (file.size > maxSize) {
        return Util.end({
          status: 0,
          msg: `文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`,
        })
      }

      // 生成文件名
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const fileExt = file.extname.toLowerCase()
      const fileName = `${timestamp}_${randomStr}${fileExt}`

      // 根据文件类型选择存储目录
      const category = this.getCategoryByMimeType(file.type)
      const categoryDirs = {
        image: 'images',
        document: 'documents',
        video: 'videos',
        audio: 'audios',
        other: 'others',
      }
      const uploadDir = Helpers.publicPath(`upload/${categoryDirs[category]}`)

      // 确保目录存在
      await fs.mkdir(uploadDir, { recursive: true })

      // 保存文件
      await file.move(uploadDir, {
        name: fileName,
        overwrite: true,
      })

      if (!file.moved()) {
        throw new Error('文件上传失败')
      }

      const filePath = `/upload/${categoryDirs[category]}/${fileName}`

      // 保存文件记录到数据库
      await Database.transaction(async (trx) => {
        const fileData = {
          file_name: file.clientName,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          file_ext: fileExt,
          category: category,
          upload_by: member_info.member_id,
        }

        const result = await filesTable.create(trx, fileData)
        if (result.status === 0) {
          throw new Error('保存文件记录失败')
        }
      })

      // 清除Dashboard统计缓存
      await this.clearDashboardCache()

      return Util.end({
        data: {
          file_path: filePath,
          file_name: file.clientName,
          category: category,
        },
        msg: '上传成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_uploadFile_1739012356882',
      })
    }
  }

  /**
   * 获取文件列表
   */
  async getFileList(ctx) {
    try {
      const { body } = ctx
      const result = await filesTable.fetchListBy(body)
      return Util.end({
        data: result.data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getFileList_1739012356882',
      })
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(ctx) {
    try {
      const { body } = ctx
      const fileId = body.file_id || body.id

      if (!fileId) {
        return Util.end({
          status: 0,
          msg: '文件ID不能为空',
        })
      }

      // 获取文件信息
      const fileResult = await filesTable.fetchDetailById(fileId)
      if (fileResult.status <= 0 || !fileResult.data) {
        return Util.end({
          status: 0,
          msg: '文件不存在',
        })
      }

      const fileInfo = fileResult.data
      const filePath = Helpers.publicPath(fileInfo.file_path.replace(/^\//, ''))

      await Database.transaction(async (trx) => {
        // 删除数据库记录
        const result = await filesTable.deleteByIds(trx, [fileId])
        if (result.status === 0) {
          throw new Error('删除文件记录失败')
        }

        // 删除物理文件
        try {
          await fs.unlink(filePath)
        } catch (err) {
          // 文件不存在不影响删除流程
          console.log('删除物理文件失败:', err.message)
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
        track: 'service_deleteFile_1739012356882',
      })
    }
  }

  /**
   * 批量删除文件
   */
  async batchDelete(ctx) {
    try {
      const { body } = ctx
      const fileIds = body.ids || []

      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return Util.end({
          status: 0,
          msg: '请选择要删除的文件',
        })
      }

      // 获取所有文件信息
      const filesResult = await Database.select('file_id', 'file_path').from('files').whereIn('file_id', fileIds)

      await Database.transaction(async (trx) => {
        // 删除数据库记录
        const result = await filesTable.deleteByIds(trx, fileIds)
        if (result.status === 0) {
          throw new Error('批量删除文件记录失败')
        }

        // 删除物理文件
        for (const file of filesResult) {
          try {
            const filePath = Helpers.publicPath(file.file_path.replace(/^\//, ''))
            await fs.unlink(filePath)
          } catch (err) {
            console.log('删除物理文件失败:', err.message)
          }
        }
      })

      // 清除Dashboard统计缓存
      await this.clearDashboardCache()

      return Util.end({
        msg: '批量删除成功',
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_batchDelete_1739012356882',
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
   * 获取文件信息
   */
  async getFileInfo(ctx) {
    try {
      const { body } = ctx
      const fileId = body.file_id || body.id

      if (!fileId) {
        return Util.end({
          status: 0,
          msg: '文件ID不能为空',
        })
      }

      const result = await filesTable.fetchDetailById(fileId)
      return result
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getFileInfo_1739012356882',
      })
    }
  }
}

module.exports = FileService
