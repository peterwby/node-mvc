'use strict'

const fs = require('fs')
const path = require('path')
const Helpers = use('Helpers')
const log = use('Logger')
const GeneratorLogger = require('./logger')

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
    const files = ['controller.js', 'service.js', 'model.js']
    for (const file of files) {
      await this.generateFile('backend', file)
    }
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
        'model.js': 'Models/Table',
      }
      const base_name = path.basename(this.menu_path)
      const file_name = template_name.replace('.js', `/${base_name}_${template_name}`)
      return path.join(Helpers.appPath(), dir_map[template_name], file_name)
    }
  }

  /**
   * 替换列表页变量
   * @param {string} content 模板内容
   * @returns {string} 替换后的内容
   */
  replaceListVariables(content) {
    let result = content

    // 1. 替换菜单路径
    result = result.replace(/\{\{\s*menu_path\s*\}\}/g, this.menu_path)

    // 2. 替换主键相关的变量
    const primary_key = this.fields.find((field) => field.key === 'PRI')?.name || ''
    result = result.replace(/\{\{\s*primary_key\s*\}\}/g, primary_key)

    // 3. 替换列表字段
    const list_fields = this.fields.map((field) => {
      // 根据字段类型生成渲染函数
      let render = ''
      switch (field.type) {
        case 'datetime':
          render = `(value) => Util.formatDateTime(value)`
          break
        case 'boolean':
          render = `(value) => value ? trans('yes') : trans('no')`
          break
        case 'number':
          render = `(value) => Util.formatNumber(value)`
          break
        default:
          render = `(value) => Util.escapeHtml(value)`
      }

      return {
        name: field.name,
        label: field.label,
        render,
      }
    })

    result = result.replace(/\{\{\s*list_fields\s*\}\}/g, JSON.stringify(list_fields))

    return result
  }

  /**
   * 替换编辑页变量
   * @param {string} content 模板内容
   * @returns {string} 替换后的内容
   */
  replaceEditVariables(content) {
    let result = content

    // 1. 替换菜单路径
    result = result.replace(/\{\{\s*menu_path\s*\}\}/g, this.menu_path)

    // 2. 替换字段相关的变量
    result = result.replace(/\{\{\s*fields\s*\}\}/g, JSON.stringify(this.fields))
    result = result.replace(/\{\{\s*has_rich_editor\s*\}\}/g, this.has_rich_editor.toString())
    result = result.replace(/\{\{\s*rich_editor_fields\s*\}\}/g, JSON.stringify(this.rich_editor_fields))

    // 3. 获取主键字段
    const primary_key = this.fields.find((field) => field.key === 'PRI')?.name || ''
    result = result.replace(/\{\{\s*primary_key\s*\}\}/g, primary_key)

    // 4. 生成表单字段的 HTML
    const formFields = this.fields
      .map((field) => {
        let fieldHtml = ''
        const infoValue = `{{ info.${field.name} }}`

        if (field.name === primary_key) {
          // 主键字段使用隐藏输入
          fieldHtml = `<input type="hidden" name="${field.name}" value="${infoValue}">`
        } else {
          fieldHtml = `
            <div class="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
              <label class="form-label max-w-56">
                {{ trans('${field.label}') }}
              </label>`

          switch (field.type) {
            case 'select':
              fieldHtml += `
              <select id="${field.name}" name="${field.name}" class="select max-w-[300px]" ${field.required ? 'required' : ''}>
                <option value="">{{ trans('please select') }}</option>
                @each(option in ${field.name}_options)
                <option value="{{ option.value }}" {{ ${infoValue} + '' === option.value + '' ? 'selected' : '' }}>
                  {{ option.label }}
                </option>
                @endeach
              </select>`
              break
            case 'textarea':
              fieldHtml += `
              <textarea id="${field.name}" name="${field.name}" class="form-textarea max-w-[800px]" rows="4"
                placeholder="{{ trans('${field.label}') }}" ${field.required ? 'required' : ''}>${infoValue}</textarea>`
              break
            case 'rich_editor':
              fieldHtml += `
              <div class="grow h-[250px] max-w-[800px]">
                <div id="${field.name}"></div>
              </div>`
              break
            case 'password':
              fieldHtml += `
              <input id="${field.name}" name="${field.name}" class="input max-w-[300px]"
                placeholder="{{ trans('${field.label}') }}" type="password" ${field.required ? 'required' : ''} />`
              break
            default:
              fieldHtml += `
              <input id="${field.name}" name="${field.name}" class="input max-w-[300px]"
                placeholder="{{ trans('${field.label}') }}" type="${field.html_type || 'text'}"
                value="${infoValue}" ${field.required ? 'required' : ''} />`
          }

          fieldHtml += `
            </div>`
        }
        return fieldHtml
      })
      .join('\n')

    result = result.replace(/\{\{\s*form_fields\s*\}\}/g, formFields)

    // 5. 生成验证规则
    const validationRules = this.fields
      .filter((field) => field.name !== primary_key && Object.keys(field.validation).length > 0)
      .map((field) => {
        return `
        ${field.name}: {
          validators: ${JSON.stringify(field.validation)}
        }`
      })
      .filter((rule) => rule)
      .join(',\n')

    result = result.replace(/\{\{\s*validation_rules\s*\}\}/g, validationRules)

    // 6. 替换富文本编辑器初始化代码
    if (this.has_rich_editor) {
      const editorInitCode = this.rich_editor_fields
        .map(
          (field) => `
      // 初始化 ${field.name} 编辑器
      editors['${field.name}'] = await new RichEditor('#${field.name}', 'simple');
      const ${field.name}Data = {{{ info.${field.name} || null }}};
      if (${field.name}Data) {
        editors['${field.name}'].setContents(${field.name}Data);
      }`
        )
        .join('\n')
      result = result.replace(/\{\{\s*editor_init_code\s*\}\}/g, editorInitCode)
    }

    return result
  }

  /**
   * 替换查看页变量
   * @param {string} content 模板内容
   * @returns {string} 替换后的内容
   */
  replaceViewVariables(content) {
    let result = content

    // 1. 替换菜单路径
    result = result.replace(/\{\{\s*menu_path\s*\}\}/g, this.menu_path)

    // 2. 获取主键字段
    const primary_key = this.fields.find((field) => field.key === 'PRI')?.name || ''
    result = result.replace(/\{\{\s*primary_key\s*\}\}/g, primary_key)

    // 3. 生成字段显示 HTML
    const fieldRows = this.fields
      .filter((field) => field.name !== primary_key) // 排除主键字段
      .map((field) => {
        let valueHtml = ''

        switch (field.type) {
          case 'rich_editor':
            valueHtml = `<div id="${field.name}" class="h-[150px]"></div>`
            break
          case 'datetime':
            valueHtml = `{{ info.${field.name} }}`
            break
          case 'boolean':
            valueHtml = `{{ info.${field.name} ? trans('yes') : trans('no') }}`
            break
          case 'select':
            valueHtml = `{{ info.${field.name}_text }}`
            break
          default:
            valueHtml = `{{ info.${field.name} || '' }}`
        }

        return `
            <tr>
              <td class="py-2 text-gray-600 font-normal">
                {{ trans('${field.label}') }}
              </td>
              <td class="py-2 text-gray-700 font-normal text-sm">
                ${valueHtml}
              </td>
            </tr>`
      })
      .join('\n')

    result = result.replace(/\{\{\s*field_rows\s*\}\}/g, fieldRows)

    // 4. 替换富文本编辑器相关变量
    result = result.replace(/\{\{\s*has_rich_editor\s*\}\}/g, this.has_rich_editor.toString())
    result = result.replace(/\{\{\s*rich_editor_fields\s*\}\}/g, JSON.stringify(this.rich_editor_fields))

    // 5. 生成富文本编辑器初始化代码
    if (this.has_rich_editor) {
      const editorInitCode = this.rich_editor_fields
        .map(
          (field) => `
      // 初始化 ${field.name} 编辑器为只读模式
      const ${field.name}Editor = await new RichEditor('#${field.name}', 'readonly');
      const ${field.name}Data = {{{ info.${field.name} || null }}};
      if (${field.name}Data) {
        ${field.name}Editor.setContents(${field.name}Data);
      }`
        )
        .join('\n')
      result = result.replace(/\{\{\s*editor_init_code\s*\}\}/g, editorInitCode)
    }

    return result
  }

  /**
   * 替换 Model 模板中的变量
   * @param {string} content - 模板内容
   * @param {object} data - 变量数据
   * @returns {string} - 替换后的内容
   */
  replaceModelVariables(content, data) {
    const { menu_path, table_name, primary_key, fields, joins, search_fields } = data

    // 获取类名
    const class_name = this.getClassName(menu_path) + 'Table'

    // 生成详情页字段
    const detail_fields = fields
      .map((field) => {
        if (field.table_alias) {
          return `${field.table_alias}.${field.name} as ${field.alias || field.name}`
        }
        return `a.${field.name}`
      })
      .join(',\n    ')

    // 生成列表页字段
    const list_fields = fields
      .map((field) => {
        if (field.table_alias) {
          return `${field.table_alias}.${field.name} as ${field.alias || field.name}`
        }
        return `a.${field.name}`
      })
      .join(',\n    ')

    // 生成关联语句
    const join_statements = joins
      ? joins
          .map((join) => {
            return `\n        .leftJoin('${join.table} as ${join.alias}', '${join.alias}.${join.foreign_key}', 'a.${join.local_key}')`
          })
          .join('')
      : ''

    // 生成搜索条件
    const search_conditions = search_fields
      ? `
        // 搜索条件
        if (obj.search) {
          table.where(function() {
            ${search_fields
              .map((field) => {
                if (field.table_alias) {
                  return `this.orWhere('${field.table_alias}.${field.name}', 'like', '%' + obj.search + '%')`
                }
                return `this.orWhere('a.${field.name}', 'like', '%' + obj.search + '%')`
              })
              .join('\n          ')}
          })
        }`
      : ''

    // 替换变量
    return content
      .replace(/{{ class_name }}/g, class_name)
      .replace(/{{ table_name }}/g, table_name)
      .replace(/{{ primary_key }}/g, primary_key)
      .replace(/{{ detail_fields }}/g, detail_fields)
      .replace(/{{ list_fields }}/g, list_fields)
      .replace(/{{ join_statements }}/g, join_statements)
      .replace(/{{ search_conditions }}/g, search_conditions)
      .replace(/{{ additional_methods }}/g, '')
  }

  /**
   * 替换 Service 模板中的变量
   * @param {string} content - 模板内容
   * @param {object} data - 变量数据
   * @returns {string} - 替换后的内容
   */
  replaceServiceVariables(content, data) {
    const { menu_path, table_name, fields, select_fields } = data

    // 获取表名的驼峰形式
    const table_name_camel = table_name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())

    // 生成下拉列表数据
    const select_list_data = select_fields
      ? select_fields
          .map((field) => {
            const table_class = this.getClassName(field.table) + 'Table'
            const table_var = field.table + 'Table'
            return `
        //获取${field.comment}下拉列表
        const ${table_class} = require('@Table/${field.table}')
        const ${table_var} = new ${table_class}()
        result = await ${table_var}.fetchAll({
          orderBy: [['sequence', 'asc']],
        })
        const ${field.name}_list = result.data.data.map(item => ({
          ${field.value_field}: item.${field.value_field},
          ${field.label_field}: item.${field.label_field},
        }))`
          })
          .join('\n')
      : ''

    // 生成下拉列表变量
    const select_list_vars = select_fields
      ? select_fields
          .map((field) => {
            return `${field.name}_list,`
          })
          .join('\n        ')
      : ''

    // 生成创建字段
    const create_fields = fields
      .filter((field) => !field.is_primary_key)
      .map((field) => {
        return `${field.name}: body.${field.name},`
      })
      .join('\n          ')

    // 生成编辑字段
    const edit_fields = fields
      .filter((field) => !field.is_primary_key)
      .map((field) => {
        return `${field.name}: body.${field.name},`
      })
      .join('\n          ')

    // 替换变量
    return content
      .replace(/{{ table_name }}/g, table_name)
      .replace(/{{ table_name_camel }}/g, table_name_camel)
      .replace(/{{ select_list_data }}/g, select_list_data)
      .replace(/{{ select_list_vars }}/g, select_list_vars)
      .replace(/{{ create_fields }}/g, create_fields)
      .replace(/{{ edit_fields }}/g, edit_fields)
  }

  /**
   * 替换 Controller 模板中的变量
   * @param {string} content - 模板内容
   * @param {object} data - 变量数据
   * @returns {string} - 替换后的内容
   */
  replaceControllerVariables(content, data) {
    const { menu_path, table_name, primary_key, fields, select_fields } = data

    // 获取类名
    const controller_name = this.getClassName(menu_path) + 'Controller'
    const service_name = this.getClassName(menu_path) + 'Service'
    const service_var = table_name + 'Service'

    // 获取视图路径
    const view_path = menu_path.replace(/^\//, '').replace(/\//g, '.')

    // 生成下拉列表变量
    const select_list_vars = select_fields
      ? select_fields
          .map((field) => {
            return `${field.name}_list`
          })
          .join(', ')
      : ''

    // 生成验证函数
    const validation_functions = this.generateValidationFunctions(menu_path, fields)

    // 替换变量
    return content
      .replace(/{{ controller_name }}/g, controller_name)
      .replace(/{{ service_name }}/g, service_name)
      .replace(/{{ service_var }}/g, service_var)
      .replace(/{{ view_path }}/g, view_path)
      .replace(/{{ primary_key }}/g, primary_key)
      .replace(/{{ select_list_vars }}/g, select_list_vars)
      .replace(/{{ validation_functions }}/g, validation_functions)
  }

  /**
   * 生成验证函数
   * @param {string} menu_path - 菜单路径
   * @param {array} fields - 字段列表
   * @returns {string} - 验证函数代码
   */
  generateValidationFunctions(menu_path, fields) {
    const validations = []

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
      track: 'listValid_' + ${Date.now()},
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
      track: 'getListValid_' + ${Date.now()},
    })
  }
}`)

    // 创建页验证
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
      if (!ctx.session.get('permissions')['${menu_path}/list@create']) {
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
      track: 'createValid_' + ${Date.now()},
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
          .filter((field) => !field.is_primary_key)
          .map((field) => {
            if (field.is_required) {
              return `${field.name}: 'required'`
            }
            return ''
          })
          .filter(Boolean)
          .join(',\n        ')}
      }
      const validation = await validate(ctx.body, rules)
      if (validation.fails()) {
        return Util.end2front({
          msg: validation.messages()[0].message,
          code: 9000,
        })
      }
    }

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/list@create']) {
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
      track: 'createInfoValid_' + ${Date.now()},
    })
  }
}`)

    // 查看页验证
    validations.push(`
async function viewValid(ctx) {
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
      const validation = await validate(ctx.body, rules)
      if (validation.fails()) {
        return Util.end2front({
          msg: validation.messages()[0].message,
          code: 9000,
        })
      }
    }

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/list@view']) {
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
      track: 'viewValid_' + ${Date.now()},
    })
  }
}`)

    // 编辑页验证
    validations.push(`
async function editValid(ctx) {
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
      const validation = await validate(ctx.body, rules)
      if (validation.fails()) {
        return Util.end2front({
          msg: validation.messages()[0].message,
          code: 9000,
        })
      }
    }

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/list@edit']) {
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
      track: 'editValid_' + ${Date.now()},
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
      body.id = Util.decode(body.id)
    }

    //参数验证
    async function paramsValid() {
      const rules = {
        id: 'required',
        ${fields
          .filter((field) => !field.is_primary_key)
          .map((field) => {
            if (field.is_required) {
              return `${field.name}: 'required'`
            }
            return ''
          })
          .filter(Boolean)
          .join(',\n        ')}
      }
      const validation = await validate(ctx.body, rules)
      if (validation.fails()) {
        return Util.end2front({
          msg: validation.messages()[0].message,
          code: 9000,
        })
      }
    }

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/list@edit']) {
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
      track: 'editInfoValid_' + ${Date.now()},
    })
  }
}`)

    // 删除验证
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
      const validation = await validate(ctx.body, rules)
      if (validation.fails()) {
        return Util.end2front({
          msg: validation.messages()[0].message,
          code: 9000,
        })
      }
    }

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/list@remove']) {
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
      track: 'removeValid_' + ${Date.now()},
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
      const validation = await validate(ctx.body, rules)
      if (validation.fails()) {
        return Util.end2front({
          msg: validation.messages()[0].message,
          code: 9000,
        })
      }
    }

    //权限验证
    async function authValid() {
      if (!ctx.session.get('permissions')['${menu_path}/list@batch-remove']) {
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
      track: 'batchRemoveValid_' + ${Date.now()},
    })
  }
}`)

    return validations.join('\n')
  }

  /**
   * 获取类名
   * @param {string} menu_path - 菜单路径
   * @returns {string} - 类名
   */
  getClassName(menu_path) {
    return menu_path
      .split('/')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  }
}

module.exports = Generator
