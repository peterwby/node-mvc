'use strict'
const Util = require('../Lib/Util')
const log = use('Logger')

class Auth {
  //检查是否有访问权限
  static async hasAuth(ctx, allowAuthList) {
    try {
      let msg = '',
        result = []
      if (ctx.session.get('userid') == 'admin') {
        return {
          auth: ['pm', 'performer', 'owner'],
          project_id: result.project_id,
        }
      }
      //本系统中，权限和项目挂钩，所以要检测此用户在项目中的权限
      const projects_member = require('../Models/DB/Table/projects_member')
      result = await projects_member.getAuth(ctx) //看是否是项目的相关人员

      if (!allowAuthList.length) {
        //不限角色,则只要是相关人员都能访问
        if (!result.data.length) {
          //无关人员
          return {
            auth: '',
            project_id: result.project_id,
            msg: '无相关信息',
          }
        }
      } else {
        //有角色限制
        let validAuth = Util.arrBothHas2(allowAuthList, result.data)
        //是否存在有效的身份权限
        if (!validAuth.length) {
          return {
            auth: '',
            project_id: result.project_id,
            msg: '没有权限',
          }
        }

        return {
          auth: validAuth,
          project_id: result.project_id,
          msg: msg,
        }
      }
      return {
        auth: result.data,
        project_id: result.project_id,
        msg: '相关人员',
      }
    } catch (err) {
      log.error(err)
      log.error('983j4f0j2')
      return {
        auth: '',
        msg: '验证权限时出错',
      }
    }
  }
}

module.exports = Auth
