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

  async signIn(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await signInValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.signIn(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      const { member_info, token } = result.data
      let member = {
        nickname: member_info.nickname,
        member_id: Util.encode(member_info.member_id),
      }
      const data = {
        token,
        member,
      }

      return Util.end2front({
        msg: '登录成功',
        data,
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_signIn_1586096752',
      })
    }
  }

  async logout(ctx) {
    try {
      //调用业务逻辑Service
      let result = await memberService.logout(ctx)
      //组装从Service返回的数据，返回给前端
      // 显式清除 session cookie
      ctx.response.clearCookie('token', {
        path: '/',
        domain: ctx.request.hostname(),
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
      })
      return Util.end2front({
        msg: 'Logout success',
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

  async list(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await listValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.list(ctx)
      //组装从Service返回的数据，返回给前端
      const data = result.data

      //渲染视图
      return ctx.view.render('admin.member.list', data)
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }

  async view(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await viewValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.view(ctx)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }
      //组装从Service返回的数据，返回给前端
      const { member_info } = result.data
      member_info.member_id = Util.encode(member_info.member_id)
      member_info.created_at = moment(member_info.created_at).format('YYYY-MM-DD')

      //渲染视图
      return ctx.view.render('admin.member.view', { member_info })
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
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
      const { member_info, status_list } = result.data
      member_info.member_id = Util.encode(member_info.member_id)
      member_info.created_at = moment(member_info.created_at).format('YYYY-MM-DD')

      //渲染视图
      return ctx.view.render('admin.member.edit', { member_info, status_list })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_edit_' + Date.now(),
      })
    }
  }

  async getList(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await getListValid(ctx)
      if (resultValid) return resultValid
      result = await memberService.getList(ctx)
      //组装从Service返回的数据，返回给前端
      const { data } = result.data
      const finalData = data.map((item) => ({
        ...item,
        member_id: Util.encode(item.member_id),
        created_at: moment(item.created_at).format('YYYY-MM-DD'),
      }))

      return ctx.response.json({
        data: finalData,
        totalCount: result.data.total,
        pageCount: result.data.perPage,
        page: result.data.page,
        // lastPage: result.data.lastPage,
      })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_getList_1582098259',
      })
    }
  }

  async signUp(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await signUpValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.signUp(ctx)
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
        track: 'controller_signUp_1586096715',
      })
    }
  }

  async updatePassword(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await updatePasswordValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.updatePassword(ctx)
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
        track: 'updatePassword_24o934j34fk',
      })
    }
  }

  async updateInfo(ctx) {
    try {
      let result = {}
      //检查参数合法性
      const resultValid = await updateInfoValid(ctx)
      if (resultValid) return resultValid
      //调用业务逻辑Service
      result = await memberService.updateInfo(ctx)
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
        track: 'controller_updateInfo_1586097585',
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

  async getFuncInfo(ctx) {
    try {
      let result = {}

      result = await memberService.getFuncInfo(ctx)
      //组装从Service返回的数据，返回给前端
      return Util.end2front({ data: result.data })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_getFuncInfo_1669936619',
      })
    }
  }

  async getFuncTime(ctx) {
    try {
      let result = await memberService.getFuncTime(ctx)
      //组装从Service返回的数据，返回给前端
      return Util.end2front({ data: result.data })
    } catch (err) {
      return Util.error2front({
        //isShowMsg: true,
        msg: err.message,
        track: 'controller_getFuncTime_1670497238',
      })
    }
  }
}

/**
 * 登录：校验合法性
 */
async function signInValid(ctx) {
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
          case 'username':
            body.username = requestAll[k]
            break
          case 'password':
            body.password = requestAll[k]
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        username: 'required',
        password: 'required',
      }
      const messages = {
        'username.required': '账号为必填项',
        'password.required': '密码为必填项',
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
      track: 'valid_signInValid_1586097764',
    })
  }
}

/**
 * 新增
 */
async function signUpValid(ctx) {
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
          case 'nickname':
            body.nickname = requestAll[k]
            break
          case 'username':
            body.username = requestAll[k]
            break
          case 'password':
            body.password = requestAll[k]
            break
          case 're_pwd':
            body.re_pwd = requestAll[k]
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        nickname: 'required|max:20',
        username: 'required',
        password: 'required|min:6|max:16',
        re_pwd: 'same:password',
      }
      const messages = {
        'nickname.required': '昵称为必填项',
        'nickname.max': '昵称不能超过20个字',
        'username.required': '账号为必填项',
        'password.required': '密码为必填项',
        'password.min': '密码最少需6位',
        'password.max': '密码最多不超过16位',
        're_pwd.same': '两次密码输入不一致',
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
      track: 'valid_signUpValid_1586097992',
    })
  }
}

/**
 * 修改密码
 */
async function updatePasswordValid(ctx) {
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
      track: 'valid_updatePasswordValid_1586098290',
    })
  }
}

async function updateInfoValid(ctx) {
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
        if (file.size > 1024 * 1024 * 100) {
          throw new Error('文件大小不能超过100M')
        }
        // if (!['csv', 'txt', 'md', 'pdf'].includes(file.extname.toLowerCase())) {
        //   throw new Error('只接受文件格式为(。。。。)')
        // }
        ctx.file = file
      }

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
          case 'nickname':
            body.nickname = requestAll[k]
            break
          case 'password':
            body.password = requestAll[k]
            break
          case 'member_status_id':
            body.member_status_id = requestAll[k]
            break
          case 'email':
            body.email = requestAll[k]
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
        nickname: 'required',
      }
      const messages = {
        'member_id.required': 'member_id为必填项',
        'nickname.required': '昵称为必填项',
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
      track: 'valid_updateInfoValid_1586098365',
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
              const ids = requestAll[k].map((item) => {
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

async function listValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.request.all()
      let body = {}
      // 只接收以下参数
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'page':
            body.page = parseInt(requestAll[k])
            break
          case 'limit':
            body.limit = parseInt(requestAll[k])
            break
          case 'search':
            body.search = requestAll[k]
            break
          case 'member_status_id':
            if (Util.isNumber(requestAll[k])) {
              body.member_status_id = parseInt(requestAll[k])
            }
            break
        }
      }
      if (!body.page) {
        body.page = 1
      }
      if (!body.limit) {
        body.limit = 10
      }
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
      track: 'valid_listValid_1736862918',
    })
  }
}

async function getListValid(ctx) {
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
          case 'page':
            body.page = requestAll[k]
            break
          case 'size':
            body.limit = requestAll[k]
            break
          case 'sortorder':
            body.sortOrder = requestAll[k]
            break
          case 'sortfield':
            body.sortField = requestAll[k]
            break
          case 'search':
            body.search = requestAll[k]
            break
          case 'member_status_id':
            if (Util.isNumber(requestAll[k])) {
              body.member_status_id = requestAll[k]
            }
            break
        }
      }
      if (!body.page) {
        body.page = 1
      }
      if (!body.limit) {
        body.limit = 10
      }
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
      track: 'valid_getListValid_1586103322',
    })
  }
}

async function viewValid(ctx) {
  try {
    //组装处理参数
    await paramsHandle()
    //校验请求参数合法性
    await paramsValid()
    //权限验证
    await authValid()

    return null

    async function paramsHandle() {
      const requestAll = ctx.params
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

    async function paramsValid() {}

    async function authValid() {
      const session = ctx.session
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_viewValid_1736952032',
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
      const requestAll = ctx.params
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
        'member_id.required': 'member_id is require',
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
      track: 'valid_editValid_1736952742',
    })
  }
}
module.exports = MemberController
