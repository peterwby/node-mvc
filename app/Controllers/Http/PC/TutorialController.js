'use strict'

const Util = require('@Lib/Util')
const TutorialService = require('@Services/TutorialService')
const tutorialService = new TutorialService()

class TutorialController {
  /**
   * JavaScript 基础语法示例
   */
  async jsBasics({ request }) {
    try {
      const result = await tutorialService.jsBasics()
      return Util.end2front({
        msg: '执行成功',
        data: result,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_jsBasics_1234567',
      })
    }
  }

  /**
   * 数据库查询示例
   */
  async dbSelect({ request }) {
    try {
      const params = request.all()
      const result = await tutorialService.dbSelect(params)
      return Util.end2front({
        msg: '查询成功',
        data: result,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_dbSelect_1234567',
      })
    }
  }

  /**
   * 数据库增删改示例
   */
  async dbModify({ request }) {
    try {
      const params = request.all()
      const result = await tutorialService.dbModify(params)
      return Util.end2front({
        msg: '操作成功',
        data: result,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_dbModify_1234567',
      })
    }
  }

  /**
   * HTTP 请求示例
   */
  async httpRequest({ request }) {
    try {
      const params = request.all()
      const result = await tutorialService.httpRequest(params)
      return Util.end2front({
        msg: '请求成功',
        data: result,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_httpRequest_1234567',
      })
    }
  }

  /**
   * Redis 操作示例
   */
  async redisOps({ request }) {
    try {
      const params = request.all()
      const result = await tutorialService.redisOps(params)
      return Util.end2front({
        msg: '操作成功',
        data: result,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_redisOps_1234567',
      })
    }
  }

  /**
   * 文件操作示例
   */
  async fileOps({ request }) {
    try {
      const params = request.all()
      const result = await tutorialService.fileOps(params)
      return Util.end2front({
        msg: '操作成功',
        data: result,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_fileOps_1234567',
      })
    }
  }
}

module.exports = TutorialController
