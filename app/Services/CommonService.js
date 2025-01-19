'use strict'

const Database = use('Database')
const log = use('Logger')
const Env = use('Env')
const Helpers = use('Helpers')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')

class CommonService extends BaseService {
  constructor(props) {
    super(props)
  }

  async uploadImage(ctx) {
    try {
      let result = {}
      const { file } = ctx

      const data = {
        url: '/upload/images/a.png',
      }
      return Util.end({ data })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service__1737270120',
      })
    }
  }
}

module.exports = CommonService
