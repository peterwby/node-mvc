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
      const member_info = ctx.session.get('member')
      const file_name = `editor_${member_info.member_id}_${Date.now()}.${file.subtype}`
      await file.move(Helpers.publicPath('upload/images'), {
        name: file_name,
        overwrite: true,
      })
      if (!file.moved()) {
        throw new Error('upload file failed')
      }
      // console.log(file.subtype, file.type, file.extname, file.fieldName, file.fileName, file.clientName)
      const data = {
        url: `/upload/images/${file_name}`,
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
