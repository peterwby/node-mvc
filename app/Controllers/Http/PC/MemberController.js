'use strict'

const { validate } = use('Validator')
const log = use('Logger')
const Util = require('@Lib/Util')
const moment = require('moment') //日期格式化插件
moment.locale('zh-cn') //设为北京时区
const MemberService = require(`@Services/MemberService`)
const memberService = new MemberService()

class MemberController {
  constructor() {}

  async login(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await loginValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.login(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      const { member_info, token } = result.data
      let member = {
        member_name: member_info.member_name,
        member_id: Util.encode(member_info.member_id),
      }
      const data = {
        token,
        member,
      }

      return Util.end2front({
        msg: '已登录',
        data,
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_login_1586096752',
      })
    }
  }

  async logout(ctx) {
    try {
      //调用业务逻辑Service
      let result = await memberService.logout(ctx)
      //组装从Service返回的数据，返回给前端
      return Util.end2front({
        msg: '已退出系统',
        code: 1001,
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_logout_1586097506',
      })
    }
  }

  async getTableCommon(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await getTableCommonValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.getTableCommon(ctx)
      //组装从Service返回的数据，返回给前端
      const data = result.data
      return Util.end2front({
        data,
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_getTableCommon_1582098238',
      })
    }
  }

  async getTable(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await getTableValid(ctx)
      if (resultValid) return resultValid
      result = await memberService.getTable(ctx)
      //组装从Service返回的数据，返回给前端
      const { data } = result.data
      const finalData = data.map((item) => ({
        ...item,
        member_id: Util.encode(item.member_id),
        ctime: moment(item.ctime).format('YYYY-MM-DD'),
      }))
      return Util.end2front({
        data: finalData,
        total: result.data.total,
        perPage: result.data.perPage,
        page: result.data.page,
        lastPage: result.data.lastPage,
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_getTable_1582098259',
      })
    }
  }

  async getEditCommon(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await getEditCommonValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.getEditCommon(ctx)
      //组装从Service返回的数据，返回给前端
      const data = result.data
      return Util.end2front({ data })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_getEditCommon_1586338587',
      })
    }
  }

  async getCreateCommon(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await getCreateCommonValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.getCreateCommon(ctx)
      //组装从Service返回的数据，返回给前端
      return Util.end2front({
        data: result.data,
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_getCreateCommon_1586403873',
      })
    }
  }

  async create(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await createValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.create(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      const { data } = result
      return Util.end2front({
        msg: '已新增',
        data,
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_create_1586096715',
      })
    }
  }

  async editPassword(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await editPasswordValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.editPassword(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      return Util.end2front({
        msg: '已更新',
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'editPassword_24o934j34fk',
      })
    }
  }

  async edit(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await editValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.edit(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      return Util.end2front({
        msg: '已更新',
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_edit_1586097585',
      })
    }
  }

  async remove(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await removeValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.remove(ctx)
      //组装从Service返回的数据，返回给前端
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }
      return Util.end2front({
        msg: '已删除',
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_remove_1586354164',
      })
    }
  }
}

/**
 * 登录：校验合法性
 */
async function loginValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'login_name':
            body.login_name = requestAll[k]
            break
          case 'login_pwd':
            body.login_pwd = requestAll[k]
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        login_name: 'required',
        login_pwd: 'required|min:6|max:16',
      }
      const messages = {
        'login_name.required': '账号为必填项',
        'login_pwd.required': '密码为必填项',
        'login_pwd.min': '密码最少需6位',
        'login_pwd.max': '密码最多不超过16位',
      }
      const validation = await validate(ctx.body, rules, messages)
      if (validation.fails()) {
        throw new Error(validation.messages()[0].message)
      }
    }

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_loginValid_1586097764',
    })
  }
}

async function getTableCommonValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}

      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {}

    async function authValid() {
      const session = ctx.session
      //检查是否有权限
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_getTableCommonValid_1586103275',
    })
  }
}

async function getTableValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'member_status_id':
            if (Util.isNumber(requestAll[k])) {
              body.member_status_id = requestAll[k]
            }
            break
          case 'page':
            body.page = requestAll[k]
            break
          case 'limit':
            body.limit = requestAll[k]
            break
          case 'search_word':
            body.search_word = requestAll[k]
            break
        }
      }
      if (!Util.objHas(body, 'page')) body.page = 1
      if (!Util.objHas(body, 'limit')) body.limit = 1000
      ctx.body = Util.deepClone(body)
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
      track: 'valid_getTableValid_1586103322',
    })
  }
}

async function getCreateCommonValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}

      ctx.body = Util.deepClone(body)
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
      track: 'valid_getCreateCommonValid_1586403896',
    })
  }
}

/**
 * 新增
 */
async function createValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'member_name':
            body.member_name = requestAll[k]
            break
          case 'email':
            body.email = requestAll[k]
            break
          case 'cellphone':
            body.cellphone = requestAll[k]
            break
          case 'login_name':
            body.login_name = requestAll[k]
            break
          case 'login_pwd':
            body.login_pwd = requestAll[k]
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        member_name: 'required|max:20',
        login_name: 'required',
        login_pwd: 'required|min:6|max:16',
        rePassword: 'same:login_pwd',
      }
      const messages = {
        'member_name.required': '昵称为必填项',
        'member_name.max': '昵称不能超过20个字',
        'login_name.required': '账号为必填项',
        'login_pwd.required': '密码为必填项',
        'login_pwd.min': '密码最少需6位',
        'login_pwd.max': '密码最多不超过16位',
        'rePassword.same': '两次密码输入不一致',
      }
      const validation = await validate(ctx.body, rules, messages)
      if (validation.fails()) {
        throw new Error(validation.messages()[0].message)
      }
    }

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_createValid_1586097992',
    })
  }
}

/**
 * 修改密码
 */
async function editPasswordValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'member_id':
            {
              const tmp = Util.decode(requestAll[k])
              if (tmp) body.member_id = tmp
            }
            break
          case 'old_pwd':
            body.old_pwd = requestAll[k]
            break
          case 'new_pwd':
            body.new_pwd = requestAll[k]
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        member_id: 'member_id',
        old_pwd: 'required',
        new_pwd: 'required|min:6|max:16',
      }
      const messages = {
        'member_id.required': 'member_id为必填项',
        'new_pwd.required': '新密码为必填项',
        'new_pwd.min': '新密码最少需6位',
        'new_pwd.max': '新密码最多不超过16位',
      }
      const validation = await validate(ctx.body, rules, messages)
      if (validation.fails()) {
        throw new Error(validation.messages()[0].message)
      }
    }

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_editPasswordValid_1586098290',
    })
  }
}

async function getEditCommonValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'member_id':
            {
              const tmp = Util.decode(requestAll[k])
              if (tmp) body.member_id = tmp
            }
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        member_id: 'required',
      }
      const messages = {
        'member_id.required': 'member_id为必填项',
      }
      const validation = await validate(ctx.body, rules, messages)
      if (validation.fails()) {
        throw new Error(validation.messages()[0].message)
      }
    }

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      code: 9000,
      track: 'valid_getEditCommonValid_1586338627',
    })
  }
}

async function editValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'member_id':
            {
              const tmp = Util.decode(requestAll[k])
              if (tmp) body.member_id = tmp
            }
            break
          case 'member_name':
            body.member_name = requestAll[k]
            break
          case 'login_pwd':
            body.login_pwd = requestAll[k]
            break
          case 'cellphone':
            body.cellphone = requestAll[k]
            break
          case 'email':
            body.email = requestAll[k]
            break
          case 'gender_id':
            body.gender_id = requestAll[k]
            break
          case 'remark':
            body.remark = requestAll[k]
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        member_id: 'required',
        member_name: 'required|max:20',
      }
      const messages = {
        'member_id.required': 'member_id为必填项',
        'member_name.required': '昵称为必填项',
        'member_name.max': '昵称不能超过20个字',
      }
      const validation = await validate(ctx.body, rules, messages)
      if (validation.fails()) {
        throw new Error(validation.messages()[0].message)
      }
    }

    async function authValid() {
      const session = ctx.session
      const member_info = session.get('member')
      //如果不是自己，则检查是否有权限修改
      if (ctx.body.member_id != member_info.member_id) {
      }
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_editValid_1586098365',
    })
  }
}

async function removeValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'ids': {
            if (Util.isArray(requestAll[k])) {
              const ids = requestAll[k].filter((item) => {
                item = Util.decode(item)
                return item
              })
              if (ids.length) {
                body.ids = ids
              }
            }
          }
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        ids: 'required',
      }
      const messages = {
        'ids.required': 'ids参数为必填项',
      }
      const validation = await validate(ctx.body, rules, messages)
      if (validation.fails()) {
        throw new Error(validation.messages()[0].message)
      }
    }

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_removeValid_1586354732',
    })
  }
}

module.exports = MemberController
