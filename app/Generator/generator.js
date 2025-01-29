'use strict'

const fs = require('fs')
const path = require('path')
const Helpers = use('Helpers')
const log = use('Logger')
const GeneratorLogger = require('./logger')
const moment = require('moment')
const { createGeneratorError } = require('./errors')

/**
 * 代码生成器类
 * 用于根据数据库表结构和 SQL 查询自动生成前后端代码
 * @class
 */
class Generator {
  /**
   * 创建代码生成器实例
   * @constructor
   * @example
   * const generator = new Generator()
   */
  constructor() {
    // 菜单路径，用于确定生成文件的位置，如 'admin/users'
    this.menu_path = ''
    // 字段定义列表，从 SQL 查询中解析得到
    this.fields = []
    // 表名列表，从 SQL 查询中解析得到
    this.tables = []
    // 表字段映射，key 为表名，value 为字段列表
    this.table_fields = {}
    // 视图文件路径，如 'resources/views/admin/users'
    this.view_path = ''
    // 是否包含富文本编辑器字段
    this.has_rich_editor = false
    // 富文本编辑器字段列表
    this.rich_editor_fields = []
    // 日志记录器实例
    this.logger = new GeneratorLogger()
  }

  /**
   * 初始化生成器参数
   * @param {string} menu_path - 菜单路径，如 'admin/users'
   * @param {Array<Object>} fields - 字段定义列表，从 SQL 查询中解析得到
   * @param {Array<Object>} tables - 表名列表，从 SQL 查询中解析得到
   * @param {Object} table_fields - 表字段映射，key 为表名，value 为字段列表
   * @throws {Error} 当参数无效或初始化失败时抛出错误
   * @example
   * generator.init(
   *   'admin/users',
   *   [{name: 'id', type: 'number'}, {name: 'name', type: 'string'}],
   *   [{name: 'users', alias: 'u'}],
   *   {users: ['id', 'name', 'created_at']}
   * )
   */
  init(menu_path, fields, tables, table_fields) {
    try {
      // 验证菜单路径
      if (!menu_path?.trim()) {
        throw createGeneratorError('INVALID_PATH', '菜单路径不能为空')
      }
      if (!menu_path.match(/^[a-z0-9_\/-]+$/i)) {
        throw createGeneratorError('INVALID_PATH', '菜单路径只能包含字母、数字、下划线和斜杠')
      }

      // 验证字段列表
      if (!Array.isArray(fields) || fields.length === 0) {
        throw createGeneratorError('MISSING_FIELDS')
      }

      // 验证表名列表
      if (!Array.isArray(tables) || tables.length === 0) {
        throw createGeneratorError('MISSING_TABLES')
      }

      // 验证表字段映射
      if (!table_fields || typeof table_fields !== 'object') {
        throw createGeneratorError('MISSING_TABLES', '缺少表字段映射')
      }

      this.menu_path = menu_path
      this.fields = fields
      this.tables = tables
      this.table_fields = table_fields
      this.view_path = path.join('resources/views', menu_path)

      this.logger.log(`初始化生成器: menu_path=${menu_path}, fields=${fields.length}个`)
    } catch (err) {
      // 如果已经是 GeneratorError，直接抛出
      if (err.name === 'GeneratorError') {
        throw err
      }
      // 否则包装为 INIT_FAILED 错误
      throw createGeneratorError('INIT_FAILED', err.message, err)
    }
  }

  /**
   * 显示代码生成工具页面
   * @param {Object} ctx - Adonis 上下文对象
   * @param {Object} ctx.view - 视图渲染器
   * @returns {Promise<string>} 渲染后的 HTML 页面
   * @example
   * // 在路由中使用
   * Route.get('generator/tool', 'GeneratorController.tool')
   */
  async tool({ view }) {
    return view.render('../../app/Generator/views/tool')
  }

  /**
   * 生成代码
   * @param {Object} ctx - Adonis 上下文对象
   * @param {Object} ctx.body - 请求体参数
   * @param {string} ctx.body.menu_path - 菜单路径
   * @param {Array<Object>} ctx.body.fields - 字段定义列表
   * @param {Array<Object>} ctx.body.tables - 表名列表
   * @param {Object} ctx.body.table_fields - 表字段映射
   * @returns {Promise<Object>} 生成结果
   * @returns {boolean} result.status - 是否成功
   * @returns {string} result.message - 结果消息
   * @returns {Object} [result.summary] - 生成摘要（仅当成功时）
   * @example
   * const result = await generator.generate({
   *   body: {
   *     menu_path: 'admin/users',
   *     fields: [{name: 'id', type: 'number'}],
   *     tables: [{name: 'users', alias: 'u'}],
   *     table_fields: {users: ['id', 'name']}
   *   }
   * })
   */
  async generate({ body }) {
    try {
      this.logger.log('开始生成代码')
      const { menu_path, fields, tables, table_fields } = body

      // 1. 初始化生成器参数
      this.init(menu_path, fields, tables, table_fields)

      // 2. 创建必要的目录结构
      await this.createDirectory()

      // 3. 生成前端文件（list/create/edit/view.edge）
      await this.generateFrontendFiles()

      // 4. 生成后端文件（Controller/Service/Table）
      await this.generateBackendFiles()

      // 5. 生成完成，返回摘要信息
      const summary = this.logger.getSummary()
      this.logger.log(`代码生成完成，总耗时: ${summary.totalTime}ms`)

      return {
        status: true,
        message: '代码生成成功',
        summary,
      }
    } catch (err) {
      // 如果已经是 GeneratorError，直接使用
      const error = err.name === 'GeneratorError' ? err : createGeneratorError('GENERATE_FAILED', err.message, err)
      // 记录错误并返回错误信息
      this.logger.error(error, 'generate')
      return {
        status: false,
        message: error.message,
        error: error.toJSON(),
      }
    }
  }

  /**
   * 创建目录结构
   * @throws {Error} 当目录创建失败时抛出错误
   * @example
   * await generator.createDirectory()
   * // 创建 resources/views/admin/users 目录
   */
  async createDirectory() {
    try {
      const dir = Helpers.resourcesPath(this.view_path)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        this.logger.log(`创建目录: ${dir}`)
      }
    } catch (err) {
      throw createGeneratorError('CREATE_DIR_FAILED', err.message, err)
    }
  }

  /**
   * 生成前端文件（list.edge, create.edge, edit.edge, view.edge）
   * @returns {Promise<void>}
   * @example
   * await generator.generateFrontendFiles()
   * // 生成以下文件：
   * // - resources/views/admin/users/list.edge
   * // - resources/views/admin/users/create.edge
   * // - resources/views/admin/users/edit.edge
   * // - resources/views/admin/users/view.edge
   */
  async generateFrontendFiles() {
    const files = ['list', 'create', 'edit', 'view']
    for (const file of files) {
      await this.generateFile('frontend', `${file}.edge`)
    }
  }

  /**
   * 生成后端文件（Controller, Service, Table）
   * @returns {Promise<void>}
   * @example
   * await generator.generateBackendFiles()
   * // 生成以下文件：
   * // - app/Controllers/Http/Admin/UsersController.js
   * // - app/Services/Admin/UsersService.js
   * // - app/Models/Table/Users.js
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
   * @returns {Promise<void>}
   * @throws {Error} 当文件生成失败时抛出错误
   * @example
   * await generator.generateTable()
   * // 生成 app/Models/Table/Users.js 文件
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
   * @param {string} type - 文件类型：'frontend' 或 'backend'
   * @param {string} template_name - 模板文件名
   * @throws {Error} 当文件生成失败时抛出错误
   * @example
   * // 生成前端列表页
   * await generator.generateFile('frontend', 'list.edge')
   *
   * // 生成后端控制器
   * await generator.generateFile('backend', 'controller.js')
   */
  async generateFile(type, template_name) {
    try {
      this.logger.log(`开始生成文件: ${type}/${template_name}`)

      // 1. 读取模板文件
      // 模板文件位于 app/Generator/templates 目录下
      const template_path = path.join(__dirname, 'templates', type, template_name)
      let template
      try {
        template = fs.readFileSync(template_path, 'utf8')
      } catch (err) {
        throw createGeneratorError('READ_TEMPLATE_FAILED', `模板文件 ${template_name} 不存在或无法读取`, err)
      }

      // 2. 替换模板变量
      // 根据不同的文件类型和模板，替换相应的变量
      const content = this.replaceTemplateVariables(template, type, template_name)

      // 3. 确定目标文件路径
      // 前端文件放在 resources/views 目录下
      // 后端文件放在 app 目录下的相应子目录中
      const target_path = this.getTargetPath(type, template_name)

      // 4. 写入文件
      try {
        fs.writeFileSync(target_path, content)
      } catch (err) {
        throw createGeneratorError('WRITE_FILE_FAILED', `无法写入文件 ${target_path}`, err)
      }

      this.logger.log(`文件生成成功: ${target_path}`)
    } catch (err) {
      // 如果已经是 GeneratorError，直接抛出
      if (err.name === 'GeneratorError') {
        throw err
      }
      // 否则包装为 GENERATE_FAILED 错误
      throw createGeneratorError('GENERATE_FAILED', `生成 ${template_name} 失败: ${err.message}`, err)
    }
  }

  /**
   * 替换模板变量
   * @param {string} template - 模板内容
   * @param {string} type - 文件类型：'frontend' 或 'backend'
   * @param {string} template_name - 模板文件名
   * @returns {string} 替换后的内容
   * @example
   * const content = generator.replaceTemplateVariables(
   *   '{{ menu_path }}/{{ table_name }}',
   *   'frontend',
   *   'list.edge'
   * )
   * // 返回: 'admin/users/users'
   */
  replaceTemplateVariables(template, type, template_name) {
    let content = template

    // 1. 替换通用变量
    content = this.replaceCommonVariables(content, {
      menu_path: this.menu_path,
      table_name: this.getTableName(),
      module_name: this.getModuleName(),
    })

    // 2. 根据文件类型替换特定变量
    switch (type) {
      case 'frontend':
        // 前端文件变量替换
        switch (template_name) {
          case 'list.edge':
            content = this.replaceListVariables(content)
            break
          case 'create.edge':
            content = this.replaceCreateVariables(content)
            break
          case 'edit.edge':
            content = this.replaceEditVariables(content)
            break
          case 'view.edge':
            content = this.replaceViewVariables(content)
            break
        }
        break
      case 'backend':
        // 后端文件变量替换
        switch (template_name) {
          case 'controller.js':
            content = this.replaceControllerVariables(content)
            break
          case 'service.js':
            content = this.replaceServiceVariables(content)
            break
          case 'table.js':
            content = this.replaceTableVariables(content)
            break
        }
        break
    }

    return content
  }

  /**
   * 替换通用模板变量
   * @param {string} template - 模板内容
   * @param {Object} variables - 变量对象，key 为变量名，value 为替换值
   * @returns {string} 替换后的内容
   * @example
   * const content = generator.replaceCommonVariables(
   *   '{{ name }} is {{ age }} years old',
   *   { name: 'John', age: 30 }
   * )
   * // 返回: 'John is 30 years old'
   */
  replaceCommonVariables(template, variables) {
    let content = template

    // 1. 替换基础变量
    // 使用正则表达式替换 {{ variable }} 格式的变量
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      content = content.replace(regex, value || '')
    }

    // 2. 替换条件块
    // 处理 {{#if condition}} content {{/if}} 格式的条件块
    content = this.replaceConditionalBlocks(content, variables)

    // 3. 替换循环块
    // 处理 {{#each items}} content {{/each}} 格式的循环块
    content = this.replaceLoopBlocks(content, variables)

    return content
  }

  /**
   * 替换列表页变量
   * @param {string} content - 模板内容
   * @param {Object} data - 数据对象
   * @returns {string} 替换后的内容
   * @example
   * const content = generator.replaceListVariables(
   *   '{{ menu_path }}/{{ primary_key }}',
   *   { menu_path: 'admin/users', primary_key: 'id' }
   * )
   * // 返回: 'admin/users/id'
   */
  replaceListVariables(content, data) {
    // 使用通用变量替换
    let result = this.replaceCommonVariables(content, data)

    // 1. 替换菜单路径
    result = result.replace(/\{\{\s*menu_path\s*\}\}/g, this.menu_path)

    // 2. 替换主键相关的变量
    // 查找主键字段，默认为 'id'
    const primary_key = this.fields.find((field) => field.key === 'PRI')?.name || 'id'
    result = result.replace(/\{\{\s*primary_key\s*\}\}/g, primary_key)

    // 3. 替换列表字段
    // 根据字段类型生成不同的渲染函数
    const list_fields = this.fields.map((field) => {
      let render = ''
      switch (field.type) {
        case 'boolean':
          // 布尔值显示为是/否
          render = `(value) => value ? trans('yes') : trans('no')`
          break
        case 'select':
          // 下拉列表显示对应的文本
          render = `(value) => getDictLabel('${field.dict_table}', value)`
          break
        case 'datetime':
          // 日期时间格式化
          render = `(value) => moment(value).format('YYYY-MM-DD HH:mm:ss')`
          break
        case 'rich_editor':
          // 富文本编辑器内容需要转义 HTML
          render = `(value) => escapeHtml(value)`
          break
        default:
          // 其他类型直接显示
          render = '(value) => value'
      }

      return {
        name: field.name,
        label: field.label || field.name,
        render,
      }
    })

    // 4. 替换搜索条件
    // 根据字段类型生成不同的搜索条件
    const search_fields = this.fields.filter(isSearchableField).map((field) => {
      let condition = ''
      switch (field.type) {
        case 'select':
          // 下拉列表精确匹配
          condition = `['${field.name}', '=', value]`
          break
        case 'datetime':
          // 日期时间范围查询
          condition = `['${field.name}', 'between', [start, end]]`
          break
        default:
          // 其他类型模糊查询
          condition = `['${field.name}', 'like', \`%\${value}%\`]`
      }

      return {
        name: field.name,
        label: field.label || field.name,
        condition,
      }
    })

    // 5. 替换字段变量
    result = result.replace('{{ list_fields }}', JSON.stringify(list_fields, null, 2)).replace('{{ search_fields }}', JSON.stringify(search_fields, null, 2))

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
