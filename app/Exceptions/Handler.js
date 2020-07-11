'use strict'

const BaseExceptionHandler = use('BaseExceptionHandler')
const log = use('Logger')
/**
 * This class handles all exceptions thrown during
 * the HTTP request lifecycle.
 *
 * @class ExceptionHandler
 */
class ExceptionHandler extends BaseExceptionHandler {
  /**
   * Handle exception thrown during the HTTP lifecycle
   *
   * @method handle
   *
   * @param  {Object} error
   * @param  {Object} options.request
   * @param  {Object} options.response
   *
   * @return {void}
   */
  async handle(error, { request, response, view }) {
    log.notice('handle_error_1092348903409')
    log.error(error)
    switch (error.name) {
      case 'InvalidSessionException':
        response.status(error.status).send('请先登录')
        //response.redirect('login')
        break
      case 'HttpException':
        response.status(error.status).send('服务端执行出错')
        break
      default:
        if (' ' + error.message.indexOf('E_MISSING_VIEW') > -1) {
          response.status(error.status).send('找不到该网址')
          return null
        }
        response.status(error.status).send('发生出错')
      //return super.handle(...arguments)
    }
    return null
  }

  /**
   * Report exception for logging or debugging.
   *
   * @method report
   *
   * @param  {Object} error
   * @param  {Object} options.request
   *
   * @return {void}
   */
  async report(error, { request }) {}
}

module.exports = ExceptionHandler
