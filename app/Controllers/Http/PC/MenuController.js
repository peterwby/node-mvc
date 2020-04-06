'use strict'

const log = use('Logger')
const Util = require('@Lib/Util')
const MenuService = require(`@Services/MenuService`)
const menuService = new MenuService()

class MenuController {
  constructor() {}

  async getMenu(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const requestAll = ctx.request.all()
      const { type } = requestAll
      //调用业务逻辑Service
      result = await menuService.getPrimaryMenu(ctx)

      return Util.end2front({
        data: result.data,
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        code: 9000,
        msg: err.message,
        track: 'getMenu_l4080Kjk23',
      })
    }
  }
}

module.exports = MenuController
