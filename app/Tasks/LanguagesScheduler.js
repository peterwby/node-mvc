'use strict'

const Task = use('Task')
const log = use('Logger')
const CommonService = require(`@Services/CommonService`)
const commonService = new CommonService()

class LanguagesScheduler extends Task {
  static get schedule() {
    return '0 0 0 1 1 *'
  }

  async handle() {
    log.info('test cron3')
    commonService.refreshCurrentLanguage()
  }
}

module.exports = LanguagesScheduler
