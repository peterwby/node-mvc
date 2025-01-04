'use strict'

const BaseExceptionHandler = use('BaseExceptionHandler')
const log = use('Logger')
const Util = require('@Lib/Util')
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
  async handle(error, ctx) {
    const { request, response, view } = ctx
    log.notice('handle_error_1092348903409')
    log.error(error)
    Util.saveLog(ctx, null, 'error', error.message)
    switch (error.name) {
      case 'InvalidSessionException':
        response.status(error.status).send('Not logged in')
        //response.redirect('login')
        break
      case 'HttpException':
        response.status(error.status).send('HttpException error')
        break
      default:
        if (' ' + error.message.indexOf('E_MISSING_VIEW') > -1) {
          response.status(error.status).send('Page not found')
          return null
        }
        response.status(error.status).send('Server error')
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
