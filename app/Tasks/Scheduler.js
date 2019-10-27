'use strict'

const Task = use('Task')
const log = use('Logger')

class Scheduler extends Task {
  static get schedule() {
    return '*/30 * * * * *'
  }

  async handle() {
    //这里可以先判断子服务器上的任务是否完成，如果未完成则退出

    log.info('test cron')
    //this.notice({ b: 2 })
  }
}

module.exports = Scheduler
