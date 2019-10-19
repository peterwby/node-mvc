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
  async handle(error, { request, response }) {
    log.notice('093j4g3j023')
    log.error(error.message)
    switch (error.name) {
      case 'InvalidSessionException':
        response.status(error.status).send('请先登录')
        //response.redirect('login')
        break
      case 'HttpException':
        response.status(error.status).send(error.message)
        break
      default:
        return super.handle(...arguments)
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
