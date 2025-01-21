'use strict'

const Task = use('Task')
const log = use('Logger')

class Scheduler extends Task {
  static get schedule() {
    return '0 0 0 0 1 *'
  }

  async handle() {
    log.info('test cron')
    //this.notice({ b: 2 })
  }
}

module.exports = Scheduler
