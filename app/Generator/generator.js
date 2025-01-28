'use strict'

const fs = require('fs')
const path = require('path')
const Helpers = use('Helpers')
const log = use('Logger')
const GeneratorLogger = require('./logger')
const moment = require('moment')

/**
 * 代码生成器类
 */
class Generator {
  constructor() {
    this.menu_path = ''
    this.fields = []
    this.tables = []
    this.table_fields = {}
    this.view_path = ''
    this.has_rich_editor = false
    this.rich_editor_fields = []
    this.logger = new GeneratorLogger()
  }

  /**
   * 初始化生成器参数
   */
  init(menu_path, fields, tables, table_fields) {
    try {
      this.menu_path = menu_path
      this.fields = fields
      this.tables = tables
      this.table_fields = table_fields
      this.view_path = path.join('resources/views', menu_path)

      this.logger.log(`初始化生成器: menu_path=${menu_path}, fields=${fields.length}个`)
    } catch (err) {
      this.logger.error(err, 'init')
      throw err
    }
  }

  /**
   * 显示工具页面
   */
  async tool({ view }) {
    return view.render('../../app/Generator/views/tool')
  }

  /**
   * 生成代码
   */
  async generate({ body }) {
    try {
      this.logger.log('开始生成代码')
      const { menu_path, fields, tables, table_fields } = body

      // 初始化参数
      this.init(menu_path, fields, tables, table_fields)

      // 1. 创建目录
      await this.createDirectory()

      // 2. 生成前端文件
      await this.generateFrontendFiles()

      // 3. 生成后端文件
      await this.generateBackendFiles()

      const summary = this.logger.getSummary()
      this.logger.log(`代码生成完成，总耗时: ${summary.totalTime}ms`)

      return {
        status: true,
        message: '代码生成成功',
        summary,
      }
    } catch (err) {
      this.logger.error(err, 'generate')
      return {
        status: false,
        message: err.message,
      }
    }
  }

  /**
   * 创建目录
   */
  async createDirectory() {
    try {
      const dir = Helpers.resourcesPath(this.view_path)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        this.logger.log(`创建目录: ${dir}`)
      }
    } catch (err) {
      this.logger.error(err, 'createDirectory')
      throw err
    }
  }

  /**
   * 生成前端文件
   */
  async generateFrontendFiles() {
    const files = ['list', 'create', 'edit', 'view']
    for (const file of files) {
      await this.generateFile('frontend', `${file}.edge`)
    }
  }

  /**
   * 生成后端文件
   */
  async generateBackendFiles() {
    // 生成控制器
    await this.generateController()
    // 生成服务层
    await this.generateService()
    // 生成表层
    await this.generateTable()
  }

  /**
   * 生成表层文件
   */
  async generateTable() {
    const template = await this.readTemplate('backend/table.js.tpl')
    const content = this.replaceTableVariables(template, {
      table_name: this.table_name,
    })
    const table_path = path.join(this.base_path, 'app/Models/Table', this.table_name + '.js')
    await this.writeFile(table_path, content)
  }

  /**
   * 生成单个文件
   * @param {string} type 文件类型：frontend 或 backend
   * @param {string} template_name 模板文件名
   */
  async generateFile(type, template_name) {
    try {
      this.logger.log(`开始生成文件: ${type}/${template_name}`)

      // 1. 读取模板文件
      const template_path = path.join(__dirname, 'templates', type, template_name)
      const template = fs.readFileSync(template_path, 'utf8')

      // 2. 替换模板变量
      const content = this.replaceTemplateVariables(template, type, template_name)

      // 3. 确定目标文件路径
      const target_path = this.getTargetPath(type, template_name)

      // 4. 写入文件
      fs.writeFileSync(target_path, content)

      this.logger.log(`文件生成成功: ${target_path}`)
    } catch (err) {
      this.logger.error(err, `generateFile: ${type}/${template_name}`)
      throw new Error(`生成 ${template_name} 失败: ${err.message}`)
    }
  }

  /**
   * 替换模板变量
   * @param {string} template 模板内容
   * @param {string} type 文件类型
   * @param {string} template_name 模板文件名
   * @returns {string} 替换后的内容
   */
  replaceTemplateVariables(template, type, template_name) {
    // TODO: 根据不同的文件类型和模板，替换相应的变量
    return template
  }

  /**
   * 获取目标文件路径
   * @param {string} type 文件类型
   * @param {string} template_name 模板文件名
   * @returns {string} 目标文件路径
   */
  getTargetPath(type, template_name) {
    if (type === 'frontend') {
      return path.join(Helpers.resourcesPath(), this.view_path, template_name)
    } else {
      // backend 文件放在对应的目录下
      const dir_map = {
        'controller.js': 'Controllers/Http',
        'service.js': 'Services',
        'table.js': 'Models/Table',
      }
      const base_name = path.basename(this.menu_path)
      const file_name = template_name.replace('.js', `/${base_name}_${template_name}`)
      return path.join(Helpers.appPath(), dir_map[template_name], file_name)
    }
  }

  /**
   * 替换通用模板变量
   * @param {string} template 模板内容
   * @param {Object} variables 变量对象
   * @returns {string} 替换后的内容
   */
  replaceCommonVariables(template, variables) {
    let content = template

    // 替换基础变量
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      content = content.replace(regex, value || '')
    }

    // 替换条件块
    content = this.replaceConditionalBlocks(content, variables)

    // 替换循环块
    content = this.replaceLoopBlocks(content, variables)

    return content
  }

  /**
   * 替换列表页变量
   * @param {string} content 模板内容
   * @param {Object} data 数据对象
   * @returns {string} 替换后的内容
   */
  replaceListVariables(content, data) {
    // 使用通用变量替换
    let result = this.replaceCommonVariables(content, data)

    // 特定的列表页变量替换
    // 1. 替换菜单路径
    result = result.replace(/\{\{\s*menu_path\s*\}\}/g, this.menu_path)

    // 2. 替换主键相关的变量
    const primary_key = this.fields.find((field) => field.key === 'PRI')?.name || 'id'
    result = result.replace(/\{\{\s*primary_key\s*\}\}/g, primary_key)

    // 3. 替换列表字段
    const list_fields = this.fields.map((field) => {
      // 根据字段类型生成渲染函数
      let render = ''
      switch (field.type) {
        case 'boolean':
          render = `(value) => value ? trans('yes') : trans('no')`
          break
        case 'select':
          render = `(value, data) => data.${field.name}_text || value`
          break
        default:
          // 其他类型（包括日期时间）直接显示值
          render = `(value) => value || ''`
      }

      return {
        name: field.name,
        label: field.label || field.name,
        render,
      }
    })

    // 将 list_fields 转换为字符串，但保持 render 函数的原始形式
    const list_fields_str = JSON.stringify(
      list_fields,
      (key, value) => {
        if (key === 'render') {
          // 保持 render 函数的原始形式
          return value.toString()
        }
        return value
      },
      2
    )
      // 移除 render 函数的引号
      .replace(/"(.*?)\(\s*value.*?\)\s*=>\s*.*?\)"/g, '$1')

    result = result.replace(/\{\{\s*list_fields\s*\}\}/g, list_fields_str)

    // 4. 替换操作列中的主键引用
    result = result.replace(/data\.\s*\+/g, `data.${primary_key}`)

    return result
  }

  /**
   * 替换编辑页变量
   * @param {string} content 模板内容
   * @param {Object} data 数据对象
   * @returns {string} 替换后的内容
   */
  replaceEditVariables(content, data) {
    // 使用通用变量替换
    let result = this.replaceCommonVariables(content, data)

    // 特定的编辑页变量替换
    // 1. 替换菜单路径
    result = result.replace(/\{\{\s*menu_path\s*\}\}/g, this.menu_path)

    // 2. 替换字段相关的变量
    result = result.replace(/\{\{\s*fields\s*\}\}/g, JSON.stringify(this.fields))
    result = result.replace(/\{\{\s*has_rich_editor\s*\}\}/g, this.has_rich_editor.toString())
    result = result.replace(/\{\{\s*rich_editor_fields\s*\}\}/g, JSON.stringify(this.rich_editor_fields))

    // 3. 获取主键字段
    const primary_key = this.fields.find((field) => field.key === 'PRI')?.name || ''
    result = result.replace(/\{\{\s*primary_key\s*\}\}/g, primary_key)

    return result
  }

  /**
   * 替换查看页变量
   * @param {string} content 模板内容
   * @param {Object} data 数据对象
   * @returns {string} 替换后的内容
   */
  replaceViewVariables(content, data) {
    // 使用通用变量替换
    let result = this.replaceCommonVariables(content, data)

    // 特定的查看页变量替换
    // 1. 替换菜单路径
    result = result.replace(/\{\{\s*menu_path\s*\}\}/g, this.menu_path)

    // 2. 替换字段相关的变量
    result = result.replace(/\{\{\s*fields\s*\}\}/g, JSON.stringify(this.fields))
    result = result.replace(/\{\{\s*has_rich_editor\s*\}\}/g, this.has_rich_editor.toString())
    result = result.replace(/\{\{\s*rich_editor_fields\s*\}\}/g, JSON.stringify(this.rich_editor_fields))

    return result
  }

  /**
   * 替换创建页变量
   * @param {string} content 模板内容
   * @param {Object} data 数据对象
   * @returns {string} 替换后的内容
   */
  replaceCreateVariables(content, data) {
    // 使用通用变量替换
    let result = this.replaceCommonVariables(content, data)

    // 特定的创建页变量替换
    // 1. 替换菜单路径
    result = result.replace(/\{\{\s*menu_path\s*\}\}/g, this.menu_path)

    // 2. 替换字段相关的变量
    result = result.replace(/\{\{\s*fields\s*\}\}/g, JSON.stringify(this.fields))
    result = result.replace(/\{\{\s*has_rich_editor\s*\}\}/g, this.has_rich_editor.toString())
    result = result.replace(/\{\{\s*rich_editor_fields\s*\}\}/g, JSON.stringify(this.rich_editor_fields))

    return result
  }

  /**
   * 替换服务层变量
   * @param {string} content 模板内容
   * @param {Object} data 数据对象
   * @returns {string} 替换后的内容
   */
  replaceServiceVariables(content, data) {
    // 使用通用变量替换
    let result = this.replaceCommonVariables(content, data)

    // 1. 生成下拉列表数据获取代码
    let select_list_data = []
    let select_list_vars = []
    this.fields.forEach((field) => {
      if (field.type === 'select') {
        const table_name = `dict_${field.name}`
        select_list_data.push(`const ${field.name}_list = await Database.table('${table_name}').select('*')`)
        select_list_vars.push(`${field.name}_list`)
      }
    })

    // 2. 生成搜索条件
    const searchable_fields = this.fields.filter(
      (field) => ['string', 'text'].includes(field.type) && ['name', 'title', 'description', 'content'].includes(field.name)
    )
    const search_conditions = searchable_fields.map((field) => `['${field.name}', 'like', \`%\${search}%\`]`)

    // 3. 生成创建和更新字段
    const create_fields = this.fields
      .filter((field) => !['id', 'created_at', 'updated_at'].includes(field.name))
      .map((field) => `${field.name}: body.${field.name}`)
      .join(',\n          ')

    // 替换变量
    result = result
      .replace(/\{\{\s*select_list_data\s*\}\}/g, select_list_data.join('\n      '))
      .replace(/\{\{\s*select_list_vars\s*\}\}/g, select_list_vars.join(',\n        '))
      .replace(/\{\{\s*search_conditions\s*\}\}/g, search_conditions.join(' OR '))
      .replace(/\{\{\s*create_fields\s*\}\}/g, create_fields)
      .replace(/\{\{\s*edit_fields\s*\}\}/g, create_fields)

    return result
  }

  /**
   * 替换表层变量
   * @param {string} content 模板内容
   * @param {Object} data 数据对象
   * @returns {string} 替换后的内容
   */
  replaceTableVariables(content, data) {
    // 使用通用变量替换
    let result = this.replaceCommonVariables(content, data)

    // 1. 替换类名相关变量
    const table_name = data.table_name
    const class_name = this.capitalize(table_name)
    result = result.replace(/\{\{\s*class_name\s*\}\}/g, class_name)

    // 2. 替换表名相关变量
    result = result.replace(/\{\{\s*table_name\s*\}\}/g, table_name)

    // 3. 替换主键相关变量
    const primary_key = this.fields.find((field) => field.key === 'PRI')?.name || 'id'
    result = result.replace(/\{\{\s*primary_key\s*\}\}/g, primary_key)

    // 4. 替换字段列表
    // 详情页字段
    const detail_fields = this.fields.map((field) => `'a.${field.name}'`).join(', ')
    result = result.replace(/\{\{\s*detail_fields\s*\}\}/g, detail_fields)

    // 列表页字段
    const list_fields = this.fields.map((field) => `'a.${field.name}'`).join(', ')
    result = result.replace(/\{\{\s*list_fields\s*\}\}/g, list_fields)

    // 5. 替换关联查询语句
    const join_statements = data.joins
      ? data.joins
          .map((join, index) => {
            const alias = String.fromCharCode(98 + index) // b, c, d...
            return `        .leftJoin('${join.table} as ${alias}', 'a.${join.foreign_key}', '${alias}.${join.primary_key}')`
          })
          .join('\n')
      : ''
    result = result.replace(/\{\{\s*join_statements\s*\}\}/g, join_statements)

    // 6. 替换搜索条件
    const search_conditions = this.fields
      .filter((field) => field.searchable)
      .map(
        (field) => `if (obj.search) {
          table.where('a.${field.name}', 'like', '%' + obj.search + '%')
        }`
      )
      .join('\n        ')
    result = result.replace(/\{\{\s*search_conditions\s*\}\}/g, search_conditions)

    // 7. 替换额外方法
    const additional_methods = data.additional_methods || ''
    result = result.replace(/\{\{\s*additional_methods\s*\}\}/g, additional_methods)

    // 8. 替换 track 参数，使用当前时间戳
    const timestamp = Date.now()
    result = result.replace(/track: 'table_(\w+)_' \+ Util\.genRandomString\(\)/g, (match, method) => {
      return `track: 'table_${method}_${timestamp}'`
    })

    return result
  }

  /**
   * 替换控制器变量
   * @param {string} content 模板内容
   * @param {Object} data 数据对象
   * @returns {string} 替换后的内容
   */
  replaceControllerVariables(content, data) {
    // 使用通用变量替换
    let result = this.replaceCommonVariables(content, data)

    // 1. 替换类名相关变量
    const class_name = this.getClassName(this.menu_path)
    result = result.replace(/\{\{\s*controller_name\s*\}\}/g, class_name + 'Controller')
    result = result.replace(/\{\{\s*service_name\s*\}\}/g, class_name + 'Service')
    result = result.replace(/\{\{\s*service_var\s*\}\}/g, this.camelCase(class_name + 'Service'))

    // 2. 替换路径相关变量
    result = result.replace(/\{\{\s*view_path\s*\}\}/g, this.menu_path.replace(/^\//, ''))

    // 3. 替换主键相关变量
    const primary_key = this.fields.find((field) => field.key === 'PRI')?.name || 'id'
    result = result.replace(/\{\{\s*primary_key\s*\}\}/g, primary_key)

    // 4. 替换选择列表变量
    result = result.replace(/\{\{\s*select_list_vars\s*\}\}/g, data.select_list_vars || '')

    // 5. 替换日期格式化代码
    const dateFields = this.fields.filter((field) => field.type === 'datetime' || field.type === 'date')
    if (dateFields.length > 0) {
      const dateFormatCode = dateFields
        .map((field) => {
          const format = field.type === 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'
          return `if (item.${field.name}) {\n          item.${field.name} = moment(item.${field.name}).format('${format}')\n        }`
        })
        .join('\n        ')
      result = result.replace(/\/\/ FORMAT_DATE_FIELDS/g, dateFormatCode)
    } else {
      result = result.replace(/\/\/ FORMAT_DATE_FIELDS/g, '')
    }

    // 6. 替换 track 参数，使用当前时间戳
    const timestamp = Date.now()
    result = result.replace(/track: 'controller_(\w+)_' \+ Util\.genRandomString\(\)/g, (match, method) => {
      return `track: 'controller_${method}_${timestamp}'`
    })

    // 7. 替换验证函数
    result = result.replace(/\{\{\s*validation_functions\s*\}\}/g, this.generateValidationFunctions(this.menu_path, this.fields))

    return result
  }

  /**
   * 转换为驼峰命名
   * @param {string} str 字符串
   * @returns {string} 驼峰命名的字符串
   */
  camelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1)
  }

  /**
   * 生成验证函数
   * @param {string} menu_path - 菜单路径
   * @param {array} fields - 字段列表
   * @returns {string} - 验证函数代码
   */
  generateValidationFunctions(menu_path, fields) {
    const validations = []
    const timestamp = Date.now() // 使用当前时间戳

    // 列表页验证
    validations.push(`
async function listValid(ctx) {
  try {
    //参数预处理
    async function paramsHandle() {
      const { body } = ctx
      //设置默认值
      body.page = body.page || 1
      body.limit = body.limit || 10
      body.search = body.search || ''
    }

    //参数验证
    async function paramsValid() {}

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/list@list']) {
        return Util.end2front({
          msg: '无权限访问',
          code: 9000,
        })
      }
    }

    await paramsHandle()
    const resultValid = await paramsValid()
    if (resultValid) return resultValid
    const resultAuth = await authValid()
    if (resultAuth) return resultAuth
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'listValid_${timestamp}',
    })
  }
}`)

    // 获取列表验证
    validations.push(`
async function getListValid(ctx) {
  try {
    //参数预处理
    async function paramsHandle() {
      const { body } = ctx
      //设置默认值
      body.page = body.page || 1
      body.limit = body.limit || 10
      body.search = body.search || ''
    }

    //参数验证
    async function paramsValid() {}

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/list@list']) {
        return Util.end2front({
          msg: '无权限访问',
          code: 9000,
        })
      }
    }

    await paramsHandle()
    const resultValid = await paramsValid()
    if (resultValid) return resultValid
    const resultAuth = await authValid()
    if (resultAuth) return resultAuth
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'getListValid_${timestamp}',
    })
  }
}`)

    // 创建页面验证
    validations.push(`
async function createValid(ctx) {
  try {
    //参数预处理
    async function paramsHandle() {
      const { body } = ctx
    }

    //参数验证
    async function paramsValid() {}

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/create@create']) {
        return Util.end2front({
          msg: '无权限访问',
          code: 9000,
        })
      }
    }

    await paramsHandle()
    const resultValid = await paramsValid()
    if (resultValid) return resultValid
    const resultAuth = await authValid()
    if (resultAuth) return resultAuth
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'createValid_${timestamp}',
    })
  }
}`)

    // 创建数据验证
    validations.push(`
async function createInfoValid(ctx) {
  try {
    //参数预处理
    async function paramsHandle() {
      const { body } = ctx
    }

    //参数验证
    async function paramsValid() {
      const rules = {
        ${fields
          .filter((field) => !field.is_primary_key && field.required)
          .map((field) => `${field.name}: 'required'`)
          .join(',\n        ')}
      }
      const validation = await validate(body, rules)
      if (validation.fails()) {
        return Util.end2front({
          msg: validation.messages()[0].message,
          code: 9000,
        })
      }
    }

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/create@create']) {
        return Util.end2front({
          msg: '无权限访问',
          code: 9000,
        })
      }
    }

    await paramsHandle()
    const resultValid = await paramsValid()
    if (resultValid) return resultValid
    const resultAuth = await authValid()
    if (resultAuth) return resultAuth
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'createInfoValid_${timestamp}',
    })
  }
}`)

    // 查看数据验证
    validations.push(`
async function viewValid(ctx) {
  try {
    //参数预处理
    async function paramsHandle() {
      const { body } = ctx
    }

    //参数验证
    async function paramsValid() {
      const rules = {
        id: 'required',
      }
      const validation = await validate(body, rules)
      if (validation.fails()) {
        return Util.end2front({
          msg: validation.messages()[0].message,
          code: 9000,
        })
      }
    }

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/view@view']) {
        return Util.end2front({
          msg: '无权限访问',
          code: 9000,
        })
      }
    }

    await paramsHandle()
    const resultValid = await paramsValid()
    if (resultValid) return resultValid
    const resultAuth = await authValid()
    if (resultAuth) return resultAuth
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'viewValid_${timestamp}',
    })
  }
}`)

    // 编辑页面验证
    validations.push(`
async function editValid(ctx) {
  try {
    //参数预处理
    async function paramsHandle() {
      const { body } = ctx
    }

    //参数验证
    async function paramsValid() {
      const rules = {
        id: 'required',
      }
      const validation = await validate(body, rules)
      if (validation.fails()) {
        return Util.end2front({
          msg: validation.messages()[0].message,
          code: 9000,
        })
      }
    }

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/edit@edit']) {
        return Util.end2front({
          msg: '无权限访问',
          code: 9000,
        })
      }
    }

    await paramsHandle()
    const resultValid = await paramsValid()
    if (resultValid) return resultValid
    const resultAuth = await authValid()
    if (resultAuth) return resultAuth
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'editValid_${timestamp}',
    })
  }
}`)

    // 编辑数据验证
    validations.push(`
async function editInfoValid(ctx) {
  try {
    //参数预处理
    async function paramsHandle() {
      const { body } = ctx
    }

    //参数验证
    async function paramsValid() {
      const rules = {
        id: 'required',
        ${fields
          .filter((field) => !field.is_primary_key && field.required)
          .map((field) => `${field.name}: 'required'`)
          .join(',\n        ')}
      }
      const validation = await validate(body, rules)
      if (validation.fails()) {
        return Util.end2front({
          msg: validation.messages()[0].message,
          code: 9000,
        })
      }
    }

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/edit@edit']) {
        return Util.end2front({
          msg: '无权限访问',
          code: 9000,
        })
      }
    }

    await paramsHandle()
    const resultValid = await paramsValid()
    if (resultValid) return resultValid
    const resultAuth = await authValid()
    if (resultAuth) return resultAuth
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'editInfoValid_${timestamp}',
    })
  }
}`)

    // 删除数据验证
    validations.push(`
async function removeValid(ctx) {
  try {
    //参数预处理
    async function paramsHandle() {
      const { body } = ctx
      body.id = Util.decode(body.id)
    }

    //参数验证
    async function paramsValid() {
      const rules = {
        id: 'required',
      }
      const validation = await validate(body, rules)
      if (validation.fails()) {
        return Util.end2front({
          msg: validation.messages()[0].message,
          code: 9000,
        })
      }
    }

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/remove@remove']) {
        return Util.end2front({
          msg: '无权限访问',
          code: 9000,
        })
      }
    }

    await paramsHandle()
    const resultValid = await paramsValid()
    if (resultValid) return resultValid
    const resultAuth = await authValid()
    if (resultAuth) return resultAuth
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'removeValid_${timestamp}',
    })
  }
}`)

    // 批量删除验证
    validations.push(`
async function batchRemoveValid(ctx) {
  try {
    //参数预处理
    async function paramsHandle() {
      const { body } = ctx
      body.ids = body.ids.map(id => Util.decode(id))
    }

    //参数验证
    async function paramsValid() {
      const rules = {
        ids: 'required|array',
      }
      const validation = await validate(body, rules)
      if (validation.fails()) {
        return Util.end2front({
          msg: validation.messages()[0].message,
          code: 9000,
        })
      }
    }

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/batch-remove@batch-remove']) {
        return Util.end2front({
          msg: '无权限访问',
          code: 9000,
        })
      }
    }

    await paramsHandle()
    const resultValid = await paramsValid()
    if (resultValid) return resultValid
    const resultAuth = await authValid()
    if (resultAuth) return resultAuth
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'batchRemoveValid_${timestamp}',
    })
  }
}`)

    return validations.join('\n\n')
  }

  /**
   * 获取类名
   * @param {string} menu_path - 菜单路径
   * @returns {string} - 类名
   */
  getClassName(menu_path) {
    // 移除开头的斜杠
    const path = menu_path.replace(/^\//, '')
    // 移除 admin/ 前缀
    const cleanPath = path.replace(/^admin\//, '')
    // 将路径分割并转换为 PascalCase
    return cleanPath
      .split('/')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  }

  /**
   * 格式化日期时间
   * @param {string|Date} date 日期时间
   * @param {string} format 格式化模式，默认 YYYY-MM-DD HH:mm:ss
   * @returns {string} 格式化后的日期时间
   */
  formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) return ''
    return moment(date).format(format)
  }

  /**
   * 格式化数字
   * @param {number} num 数字
   * @param {number} decimals 小数位数
   * @returns {string} 格式化后的数字
   */
  formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) return ''
    return Number(num).toFixed(decimals)
  }

  /**
   * HTML转义
   * @param {string} str 需要转义的字符串
   * @returns {string} 转义后的字符串
   */
  escapeHtml(str) {
    if (!str) return ''
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;',
    }
    return String(str).replace(/[&<>"'`=\/]/g, (s) => entityMap[s])
  }

  /**
   * 首字母大写
   * @param {string} str 字符串
   * @returns {string} 首字母大写后的字符串
   */
  capitalize(str) {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /**
   * 替换条件块
   * @param {string} content 内容
   * @param {Object} variables 变量
   * @returns {string} 替换后的内容
   */
  replaceConditionalBlocks(content, variables) {
    const ifRegex = /\{\{\s*if\s+(.+?)\s*\}\}([\s\S]*?)\{\{\s*endif\s*\}\}/g
    return content.replace(ifRegex, (match, condition, block) => {
      try {
        // 创建一个安全的求值环境
        const evalContext = { ...variables }
        const result = new Function('ctx', `with(ctx) { return !!(${condition}) }`)(evalContext)
        return result ? block : ''
      } catch (err) {
        console.error('条件块处理错误:', err)
        return ''
      }
    })
  }

  /**
   * 替换循环块
   * @param {string} content 内容
   * @param {Object} variables 变量
   * @returns {string} 替换后的内容
   */
  replaceLoopBlocks(content, variables) {
    const forRegex = /\{\{\s*for\s+(\w+)\s+in\s+(.+?)\s*\}\}([\s\S]*?)\{\{\s*endfor\s*\}\}/g
    return content.replace(forRegex, (match, item, list, block) => {
      try {
        // 获取循环数组
        const array = new Function('ctx', `with(ctx) { return ${list} }`)(variables)
        if (!Array.isArray(array)) return ''

        // 处理每个循环项
        return array
          .map((itemValue) => {
            const itemVariables = { ...variables, [item]: itemValue }
            return this.replaceTemplateVariables(block, itemVariables)
          })
          .join('')
      } catch (err) {
        console.error('循环块处理错误:', err)
        return ''
      }
    })
  }

  /**
   * 生成控制器文件
   */
  async generateController() {
    const template = await this.readTemplate('backend/controller.js.tpl')
    const content = this.replaceControllerVariables(template, {})
    // 修改：直接放在 Controllers/Http 目录下
    const controller_path = path.join(this.base_path, 'app/Controllers/Http', this.getClassName(this.menu_path) + 'Controller.js')
    await this.writeFile(controller_path, content)
  }

  /**
   * 生成服务层文件
   */
  async generateService() {
    const template = await this.readTemplate('backend/service.js.tpl')
    const content = this.replaceServiceVariables(template, {
      table_name: this.table_name,
    })
    // 修改：直接放在 Services 目录下
    const service_path = path.join(this.base_path, 'app/Services', this.getClassName(this.menu_path) + 'Service.js')
    await this.writeFile(service_path, content)
  }
}

module.exports = Generator
