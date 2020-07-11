'use strict'

const log = use('Logger')
const Env = use('Env')
/**
 * 给view模板设置全局变量
 */
class HtmlGlobal {
  async handle({ view }, next) {
    view.share({
      version: Env.get('VERSION', new Date().getTime()),
    })

    await next()
  }
}

module.exports = HtmlGlobal
