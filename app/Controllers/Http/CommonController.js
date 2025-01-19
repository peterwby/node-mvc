'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const CommonService = require(`@Services/CommonService`)
const commonService = new CommonService()

class CommonController {
  constructor() {}

  async uploadImage(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await uploadImageValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await commonService.uploadImage(ctx)
      //组装从Service返回的数据，返回给前端
      return Util.end2front(result)
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_uploadImage_1737261698',
      })
    }
  }
}

async function uploadImageValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const file = ctx.request.file('file')
      if (file) {
        if (file.size > 1024 * 1024 * 10) {
          throw new Error('图片大小不能超过10M')
        }
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.extname.toLowerCase())) {
          throw new Error('只接受图片格式文件(jpg/jpeg/png/gif/webp)')
        }
        ctx.file = file
      }
    }

    async function paramsValid() {}

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_Valid_1737261721',
    })
  }
}

module.exports = CommonController
