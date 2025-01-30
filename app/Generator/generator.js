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
   */
  replaceListVariables(content, data) {
    // 使用通用变量替换
    let result = this.replaceCommonVariables(content, data)

    // 1. 替换路径相关变量
    const api_path = this.menu_path.replace(/^\/admin\//, '')
    result = result.replace(/\{\{\s*menu_path\s*\}\}/g, '/admin/' + api_path)
    result = result.replace(/\{\{\s*api_path\s*\}\}/g, api_path)

    // 2. 替换主键相关的变量
    const primary_key = this.fields.find((field) => field.key === 'PRI')?.name || 'id'

    // 3. 生成表格相关的 HTML
    // 3.1 复选框列（如果有主键）
    const checkbox_th = primary_key
      ? '<th class="w-[44px] text-center"><input class="checkbox checkbox-sm" data-datatable-check="true" type="checkbox" /></th>'
      : ''
    const checkbox_td = primary_key
      ? '<td class="text-center"><input class="checkbox checkbox-sm" type="checkbox" value="{{ item.' + primary_key + ' }}" /></td>'
      : ''
    result = result.replace(/\{\{\s*checkbox_th\s*\}\}/g, checkbox_th)
    result = result.replace(/\{\{\s*checkbox_td\s*\}\}/g, checkbox_td)

    // 3.2 字段列
    const field_headers = this.fields
      .map(
        (field) => `<th class="min-w-[200px]">
          <span class="sort asc">
            <span class="sort-label font-normal text-gray-700">
              {{ trans('${field.label || field.name}') }}
            </span>
            <span class="sort-icon">
              <i class="ki-outline ki-arrow-up"></i>
              <i class="ki-outline ki-arrow-down"></i>
            </span>
          </span>
        </th>`
      )
      .join('\n')
    result = result.replace(/\{\{\s*field_headers\s*\}\}/g, field_headers)

    const field_columns = this.fields
      .map((field) => {
        let render = ''
        switch (field.type) {
          case 'boolean':
            render = `{{ item.${field.name} ? trans('yes') : trans('no') }}`
            break
          case 'select':
            render = `{{ getDictLabel('${field.dict_table}', item.${field.name}) }}`
            break
          case 'datetime':
            render = `{{ moment(item.${field.name}).format('YYYY-MM-DD HH:mm:ss') }}`
            break
          case 'rich_editor':
            render = `{{{ escapeHtml(item.${field.name}) }}}`
            break
          default:
            render = `{{ item.${field.name} }}`
        }
        return `<td>${render}</td>`
      })
      .join('\n')
    result = result.replace(/\{\{\s*field_columns\s*\}\}/g, field_columns)

    // 3.3 操作列（如果有主键）
    const operation_th = primary_key ? '<th class="w-[120px] text-center">{{ trans(\'operation\') }}</th>' : ''
    const operation_td = primary_key
      ? `<td class="text-center">
          <div class="flex items-center justify-center gap-2">
            <a href="/admin/${api_path}/view/{{ item.${primary_key} }}" class="btn btn-icon btn-sm btn-secondary">
              <i class="ki-outline ki-eye fs-2"></i>
            </a>
            <a href="/admin/${api_path}/edit/{{ item.${primary_key} }}" class="btn btn-icon btn-sm btn-primary">
              <i class="ki-outline ki-pencil fs-2"></i>
            </a>
            <button type="button" class="btn btn-icon btn-sm btn-danger delete-btn" data-id="{{ item.${primary_key} }}">
              <i class="ki-outline ki-trash fs-2"></i>
            </button>
          </div>
        </td>`
      : ''
    result = result.replace(/\{\{\s*operation_th\s*\}\}/g, operation_th)
    result = result.replace(/\{\{\s*operation_td\s*\}\}/g, operation_td)

    // 4. 生成 datatable 列定义
    const column_defs = []

    // 4.1 添加复选框列
    if (primary_key) {
      column_defs.push(`      ${primary_key}: {
        render: (item) => {
          return '<input class="checkbox checkbox-sm" data-datatable-row-check="true" type="checkbox" value="' + item + '">'
        }
      }`)
    }

    // 4.2 添加数据列
    this.fields.forEach((field) => {
      let columnDef = `      ${field.name}: {`

      // 根据字段类型添加渲染函数
      switch (field.type) {
        case 'boolean':
          columnDef += `
        render: (value) => value ? trans('yes') : trans('no')`
          break
        case 'select':
          columnDef += `
        render: (value) => getDictLabel('${field.dict_table}', value)`
          break
        case 'datetime':
          columnDef += `
        render: (value) => moment(value).format('YYYY-MM-DD HH:mm:ss')`
          break
        case 'rich_editor':
          columnDef += `
        render: (value) => escapeHtml(value)`
          break
      }

      columnDef += `
      }`
      column_defs.push(columnDef)
    })

    // 4.3 添加操作列
    if (primary_key) {
      column_defs.push(`      action: {
        render: (item, data) => {
          return '<div class="menu flex-inline" data-menu="true">' +
            '<div class="menu-item" data-menu-item-offset="0, 10px" data-menu-item-placement="bottom-end" data-menu-item-placement-rtl="bottom-start" data-menu-item-toggle="dropdown" data-menu-item-trigger="click|lg:click">' +
            '<button class="menu-toggle btn btn-sm btn-icon btn-light btn-clear">' +
            '<i class="ki-filled ki-dots-vertical"></i>' +
            '</button>' +
            '<div class="menu-dropdown menu-default w-full max-w-[120px]" data-menu-dismiss="true">' +
            '<div class="menu-item">' +
            '<a class="menu-link" href="/admin/${api_path}/view/' + data.${primary_key} + '">' +
            '<span class="menu-title">' + trans('view') + '</span>' +
            '</a>' +
            '</div>' +
            (hasPermission('/admin/${api_path}/list@edit') ?
            '<div class="menu-item">' +
            '<a class="menu-link" href="/admin/${api_path}/edit/' + data.${primary_key} + '">' +
            '<span class="menu-title">' + trans('edit') + '</span>' +
            '</a>' +
            '</div>' : '') +
            '<div class="menu-separator"></div>' +
            (hasPermission('/admin/${api_path}/list@remove') ?
            '<div class="menu-item">' +
            '<button type="button" class="menu-link remove-btn" data-id="' + data.${primary_key} + '">' +
            '<span class="menu-title">' + trans('delete') + '</span>' +
            '</button>' +
            '</div>' : '') +
            '</div>' +
            '</div>' +
            '</div>'
        }
      }`)
    }

    // 4.4 替换列定义
    result = result.replace(/\{\{\s*column_defs\s*\}\}/g, column_defs.join(',\n'))

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
    result = result.replace(/\{\{\s*timestamp\s*\}\}/g, timestamp)

    // 7. 替换验证函数
    result = result.replace(/\{\{\s*validation_functions\s*\}\}/g, this.generateValidationFunctions(this.menu_path, this.fields))

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

    // 1. 替换类名相关变量
    const class_name = this.getClassName(this.menu_path)
    const table_name = data.table_name
    const table_name_camel = this.camelCase(class_name)
    const table_instance_name = this.camelCase(class_name) + 'Table'

    result = result.replace(/\{\{\s*class_name\s*\}\}/g, class_name)
    result = result.replace(/\{\{\s*service_name\s*\}\}/g, class_name + 'Service')
    result = result.replace(/\{\{\s*table_name_camel\s*\}\}/g, table_instance_name)

    // 2. 生成下拉列表数据获取代码
    let select_list_data = []
    let select_list_vars = []
    this.fields.forEach((field) => {
      if (field.type === 'select') {
        const table_name = `dict_${field.name}`
        select_list_data.push(`const ${field.name}_list = await Database.table('${table_name}').select('*')`)
        select_list_vars.push(`${field.name}_list`)
      }
    })

    // 3. 生成搜索条件
    const searchable_fields = this.fields.filter(
      (field) => ['string', 'text'].includes(field.type) && ['name', 'title', 'description', 'content'].includes(field.name)
    )
    const search_conditions = `table.where(function() {
          this.where('${searchable_fields[0].name}', 'like', \`%\${search}%\`)${searchable_fields
      .slice(1)
      .map((field) => `.orWhere('${field.name}', 'like', \`%\${search}%\`)`)
      .join('')}
        })`

    // 4. 生成创建和更新字段
    const create_fields = this.fields
      .filter((field) => !['id', 'created_at', 'updated_at'].includes(field.name))
      .map((field) => `${field.name}: body.${field.name}`)
      .join(',\n          ')

    // 5. 替换 track 参数，使用当前时间戳
    const timestamp = Date.now()
    result = result.replace(/\{\{\s*timestamp\s*\}\}/g, timestamp)

    // 替换变量
    result = result
      .replace(/\{\{\s*select_list_data\s*\}\}/g, select_list_data.join('\n      '))
      .replace(/\{\{\s*select_list_vars\s*\}\}/g, select_list_vars.join(',\n        '))
      .replace(/\{\{\s*search_conditions\s*\}\}/g, search_conditions)
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
    result = result.replace(/\{\{\s*timestamp\s*\}\}/g, timestamp)

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
    const timestamp = Date.now()

    // 列表页验证
    validations.push(`
async function listValid(ctx) {
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

    async function authValid() {}
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_listValid_${timestamp}',
    })
  }
}`)

    // 获取列表验证
    validations.push(`
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

    async function authValid() {}
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_getListValid_${timestamp}',
    })
  }
}`)

    // 创建页面验证
    validations.push(`
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
      const requestAll = ctx.params
      let body = {}
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {}

    async function authValid() {}
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_createValid_${timestamp}',
    })
  }
}`)

    // 创建数据验证
    validations.push(`
async function createInfoValid(ctx) {
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
          ${fields
            .filter((field) => !['id', 'created_at', 'updated_at'].includes(field.name))
            .map(
              (field) => `case '${field.name}':
            body.${field.name} = Util.filterXss(requestAll[k])
            break`
            )
            .join('\n          ')}
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        ${fields
          .filter((field) => !['id', 'created_at', 'updated_at'].includes(field.name) && field.required)
          .map((field) => `${field.name}: 'required'`)
          .join(',\n        ')}
      }
      const validation = await validate(ctx.body, rules)
      if (validation.fails()) {
        throw new Error(validation.messages()[0].message)
      }
    }

    async function authValid() {}
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_createInfoValid_${timestamp}',
    })
  }
}`)

    // 查看数据验证
    validations.push(`
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
          case 'id':
            {
              const tmp = Util.decode(requestAll[k])
              if (tmp) body.id = tmp
            }
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {}

    async function authValid() {}
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_viewValid_${timestamp}',
    })
  }
}`)

    // 编辑页面验证
    validations.push(`
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
          case 'id':
            {
              const tmp = Util.decode(requestAll[k])
              if (tmp) body.id = tmp
            }
            break
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        id: 'required',
      }
      const messages = {
        'id.required': 'id is required',
      }
      const validation = await validate(ctx.body, rules)
      if (validation.fails()) {
        throw new Error(validation.messages()[0].message)
      }
    }

    async function authValid() {}
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_editValid_${timestamp}',
    })
  }
}`)

    // 更新数据验证
    validations.push(`
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
      const requestAll = ctx.request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'id':
            {
              const tmp = Util.decode(requestAll[k])
              if (tmp) body.id = tmp
            }
            break
          ${fields
            .filter((field) => !['id', 'created_at', 'updated_at'].includes(field.name))
            .map(
              (field) => `case '${field.name}':
            body.${field.name} = Util.filterXss(requestAll[k])
            break`
            )
            .join('\n          ')}
        }
      }
      ctx.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        id: 'required',
        ${fields
          .filter((field) => !['id', 'created_at', 'updated_at'].includes(field.name) && field.required)
          .map((field) => `${field.name}: 'required'`)
          .join(',\n        ')}
      }
      const validation = await validate(ctx.body, rules)
      if (validation.fails()) {
        throw new Error(validation.messages()[0].message)
      }
    }

    async function authValid() {}
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_updateInfoValid_${timestamp}',
    })
  }
}`)

    // 删除数据验证
    validations.push(`
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

  /**
   * 判断字段是否可以作为搜索条件
   * @param {Object} field - 字段定义
   * @returns {boolean} - 是否可搜索
   */
  isSearchableField(field) {
    // 不可搜索的字段类型
    const unsearchableTypes = ['rich_editor', 'password', 'file', 'image']

    // 不可搜索的字段名
    const unsearchableNames = ['id', 'created_at', 'updated_at', 'deleted_at']

    // 检查字段类型
    if (unsearchableTypes.includes(field.type)) {
      return false
    }

    // 检查字段名
    if (unsearchableNames.includes(field.name)) {
      return false
    }

    return true
  }

  /**
   * 生成系统配置（路由、菜单、权限）
   * @returns {Promise<void>}
   * @throws {Error} 当配置生成失败时抛出错误
   */
  async generateSystemConfig() {
    try {
      const Database = use('Database')
      const PrimaryMenusTable = require('@Table/primary_menus')
      const PermissionsTable = require('@Table/permissions')
      const RolePermissionsTable = require('@Table/role_permissions')
      const primaryMenusTable = new PrimaryMenusTable()
      const permissionsTable = new PermissionsTable()
      const rolePermissionsTable = new RolePermissionsTable()

      // 生成路由配置
      await this.generateRoutes()
      const module_name = this.getModuleName()

      // 处理菜单路径，确保正确的格式
      const menu_url = this.menu_path.replace(/^\/?(admin\/)?/, '')
      this.logger.log(`处理后的菜单路径: ${menu_url}`)

      const permissions = [
        // 菜单权限
        {
          name: `${module_name}列表`,
          type: 'menu',
          key: `/admin/${menu_url}/list`,
          description: `${module_name}管理-列表页面`,
        },
        {
          name: `${module_name}查看`,
          type: 'menu',
          key: `/admin/${menu_url}/view/:id`,
          description: `${module_name}管理-查看页面`,
        },
        {
          name: `${module_name}编辑`,
          type: 'menu',
          key: `/admin/${menu_url}/edit/:id`,
          description: `${module_name}管理-编辑页面`,
        },
        {
          name: `${module_name}创建`,
          type: 'menu',
          key: `/admin/${menu_url}/create`,
          description: `${module_name}管理-创建页面`,
        },
        // API权限
        {
          name: `获取${module_name}列表`,
          type: 'api',
          key: `/api/${menu_url}/get-list`,
          description: `获取${module_name}列表数据`,
        },
        {
          name: `创建${module_name}`,
          type: 'api',
          key: `/api/${menu_url}/create-info`,
          description: `创建新${module_name}`,
        },
        {
          name: `更新${module_name}`,
          type: 'api',
          key: `/api/${menu_url}/update-info`,
          description: `更新${module_name}信息`,
        },
        {
          name: `删除${module_name}`,
          type: 'api',
          key: `/api/${menu_url}/remove`,
          description: `删除${module_name}`,
        },
        // 元素权限
        {
          name: '编辑按钮',
          type: 'element',
          key: `/admin/${menu_url}/list@edit`,
          description: `${module_name}列表中的编辑按钮`,
        },
        {
          name: '删除按钮',
          type: 'element',
          key: `/admin/${menu_url}/list@remove`,
          description: `${module_name}列表中的删除按钮`,
        },
        {
          name: '创建按钮',
          type: 'element',
          key: `/admin/${menu_url}/list@create`,
          description: `${module_name}列表中的创建按钮`,
        },
        {
          name: '批量删除按钮',
          type: 'element',
          key: `/admin/${menu_url}/list@batch-remove`,
          description: `${module_name}列表中的批量删除按钮`,
        },
      ]

      console.log('开始操作数据库')
      // 在同一个事务中创建权限记录并分配给超级管理员
      await Database.transaction(async (trx) => {
        this.logger.log('开始数据库事务')

        // 1. 生成父菜单记录
        const parent_menu_data = {
          title: `${module_name} manage`, // 英文标题
          title_cn: `${module_name}管理`, // 中文标题
          url: null, // 父菜单没有URL
          icon: 'ki-file-document', // 默认图标
          parent_id: 0, // 顶级菜单
          sort: 10, // 排序号
          level: 1, // 层级
          is_leaf: 0, // 不是叶子节点
          spread: 0, // 展开状态
          status: 1, // 启用状态
        }
        this.logger.log(`准备创建父菜单记录: ${JSON.stringify(parent_menu_data)}`)

        let parent_menu_id
        try {
          const parent_menu_result = await primaryMenusTable.create(trx, parent_menu_data)
          if (!parent_menu_result || parent_menu_result.status !== 1) {
            throw new Error(`创建父菜单记录失败: ${parent_menu_result?.msg || '未知错误'}`)
          }
          parent_menu_id = parent_menu_result.data.new_id
          this.logger.log(`创建父菜单记录成功，ID: ${parent_menu_id}`)
        } catch (err) {
          this.logger.error(`创建父菜单记录失败: ${err.message}`)
          throw err
        }

        // 2. 生成子菜单记录（列表页）
        const child_menu_data = {
          title: `${module_name} list`, // 英文标题
          title_cn: `${module_name}列表`, // 中文标题
          url: `/admin/${menu_url}/list`, // 列表页URL
          icon: null, // 子菜单不需要图标
          parent_id: parent_menu_id, // 父菜单ID
          sort: 10, // 排序号
          level: 2, // 层级
          is_leaf: 1, // 是叶子节点
          spread: 0, // 展开状态
          status: 1, // 启用状态
        }
        this.logger.log(`准备创建子菜单记录: ${JSON.stringify(child_menu_data)}`)

        try {
          const child_menu_result = await primaryMenusTable.create(trx, child_menu_data)
          if (!child_menu_result || child_menu_result.status !== 1) {
            throw new Error(`创建子菜单记录失败: ${child_menu_result?.msg || '未知错误'}`)
          }
          this.logger.log(`创建子菜单记录成功: ${JSON.stringify(child_menu_result)}`)
        } catch (err) {
          this.logger.error(`创建子菜单记录失败: ${err.message}`)
          throw err
        }

        // 3. 生成权限记录并为超级管理员分配权限
        const created_permission_ids = []
        for (const perm of permissions) {
          const result = await permissionsTable.create(trx, perm)
          if (result.status === 1 && result.data.new_id) {
            created_permission_ids.push(result.data.new_id)
          } else {
            throw new Error(`创建权限记录失败: ${result.msg}`)
          }
        }
        this.logger.log(`创建权限记录: ${permissions.length}个`)

        // 为超级管理员分配权限
        for (const permission_id of created_permission_ids) {
          const result = await rolePermissionsTable.create(trx, {
            role_id: 1, // 超级管理员角色ID
            permission_id: permission_id,
          })
          if (result.status !== 1) {
            throw new Error(`分配权限失败: ${result.msg}`)
          }
        }
        this.logger.log('为超级管理员分配新权限')
      })
    } catch (err) {
      throw createGeneratorError('CONFIG_FAILED', err.message, err)
    }
  }

  /**
   * 生成路由配置
   * @returns {Promise<void>}
   * @throws {Error} 当路由生成失败时抛出错误
   */
  async generateRoutes() {
    try {
      const routes_file = 'start/routes.js'
      this.logger.log(`开始生成路由配置，目标文件: ${routes_file}`)

      // 读取路由文件
      let routes_content
      try {
        routes_content = await fs.promises.readFile(routes_file, 'utf8')
        this.logger.log(`成功读取路由文件，内容长度: ${routes_content.length}字符`)
      } catch (err) {
        this.logger.error(`读取路由文件失败: ${err.message}`)
        throw err
      }

      // 获取模块名和控制器名
      const module_name = this.getModuleName()
      const controller_name = this.getClassName(this.menu_path) + 'Controller'
      this.logger.log(`模块名: ${module_name}, 控制器名: ${controller_name}`)

      // 1. 生成前端路由配置
      const frontend_routes = `    Route.get('${this.menu_path.replace(/^\/admin\//, '')}/list', '${controller_name}.list')
    Route.get('${this.menu_path.replace(/^\/admin\//, '')}/view/:id', '${controller_name}.view')
    Route.get('${this.menu_path.replace(/^\/admin\//, '')}/edit/:id', '${controller_name}.edit')
    Route.get('${this.menu_path.replace(/^\/admin\//, '')}/create', '${controller_name}.create')`
      this.logger.log(`生成的前端路由配置:\n${frontend_routes}`)

      // 2. 生成后端 API 路由配置
      const api_routes = `    Route.post('${this.menu_path.replace(/^\/admin\//, '')}/get-list', '${controller_name}.getList')
    Route.post('${this.menu_path.replace(/^\/admin\//, '')}/create-info', '${controller_name}.createInfo')
    Route.post('${this.menu_path.replace(/^\/admin\//, '')}/update-info', '${controller_name}.updateInfo')
    Route.post('${this.menu_path.replace(/^\/admin\//, '')}/remove', '${controller_name}.remove')
    `
      this.logger.log(`生成的后端 API 路由配置:\n${api_routes}`)

      // 3. 插入前端路由
      const view_auth_group_start = routes_content.indexOf('// View层 - 需要验证身份的路由')
      this.logger.log(`找到前端路由组的位置: ${view_auth_group_start}`)
      if (view_auth_group_start === -1) {
        this.logger.error('找不到前端路由组')
        throw new Error('找不到前端路由组')
      }

      const view_try_block_start = routes_content.indexOf('try {', view_auth_group_start)
      const first_route_start = routes_content.indexOf("Route.get('/'", view_try_block_start)
      const first_route = "Route.get('/', 'HomeController.home')"

      // 4. 插入后端 API 路由
      const api_auth_group_start = routes_content.indexOf('Route.group(() => {', 0)
      this.logger.log(`找到后端 API 路由组的位置: ${api_auth_group_start}`)
      if (api_auth_group_start === -1) {
        this.logger.error('找不到后端 API 路由组')
        throw new Error('找不到后端 API 路由组')
      }

      const api_try_block_start = routes_content.indexOf('try {', api_auth_group_start)
      const first_api_route_start = routes_content.indexOf("Route.post('upload/image'", api_try_block_start)

      // 5. 构建更新后的内容
      const updated_content =
        routes_content.slice(0, first_api_route_start) +
        api_routes +
        '\n' +
        routes_content.slice(first_api_route_start, first_route_start + first_route.length) +
        '\n' +
        frontend_routes +
        '\n' +
        routes_content.slice(first_route_start + first_route.length)

      this.logger.log(`更新后的内容长度: ${updated_content.length}`)

      // 写入文件
      try {
        await fs.promises.writeFile(routes_file, updated_content, 'utf8')
        this.logger.log(`成功写入更新后的路由文件`)
      } catch (err) {
        this.logger.error(`写入路由文件失败: ${err.message}`)
        throw err
      }

      this.logger.log(`路由配置生成完成`)
    } catch (err) {
      this.logger.error(`生成路由配置失败: ${err.message}`)
      throw createGeneratorError('ROUTES_FAILED', err.message, err)
    }
  }

  /**
   * 获取模块名称
   * @returns {string} 模块名称
   */
  getModuleName() {
    const parts = this.menu_path.split('/')
    const last_part = parts[parts.length - 1]
    return last_part.charAt(0).toUpperCase() + last_part.slice(1)
  }
}

module.exports = Generator
