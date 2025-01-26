'use strict'

const fs = require('fs')
const path = require('path')
const Helpers = use('Helpers')
const log = use('Logger')

/**
 * 代码生成器类
 */
class Generator {
  constructor(menu_path, fields, tables, table_fields) {
    this.menu_path = menu_path
    this.fields = fields
    this.tables = tables
    this.table_fields = table_fields
    this.view_path = path.join('resources/views', menu_path)

    // 从 fields 中提取特殊字段
    this.has_rich_editor = fields.some((field) => field.type === 'rich_editor')
    this.rich_editor_fields = this.has_rich_editor ? fields.filter((field) => field.type === 'rich_editor') : []
    this.select_fields = fields.filter((field) => field.type === 'select')
  }

  /**
   * 生成所有代码文件
   */
  async generate() {
    try {
      // 1. 创建目录
      await this.createDirectory()

      // 2. 生成前端文件
      await this.generateFrontendFiles()

      // 3. 生成后端文件
      await this.generateBackendFiles()

      return {
        status: true,
        message: '代码生成成功',
      }
    } catch (err) {
      log.error('代码生成错误:', err)
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
    const dir = Helpers.resourcesPath(this.view_path)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
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
      // 1. 读取模板文件
      const template_path = path.join(__dirname, 'templates', type, template_name)
      const template = fs.readFileSync(template_path, 'utf8')

      // 2. 替换模板变量
      const content = this.replaceTemplateVariables(template, type, template_name)

      // 3. 确定目标文件路径
      const target_path = this.getTargetPath(type, template_name)

      // 4. 写入文件
      fs.writeFileSync(target_path, content)
    } catch (err) {
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
    let content = template

    // 1. 替换通用变量
    content = content.replace(/\{\{\s*menu_path\s*\}\}/g, this.menu_path)

    // 2. 根据不同的文件类型替换特定变量
    if (type === 'frontend') {
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
    } else {
      // backend 文件的变量替换
      content = this.replaceBackendVariables(content, template_name)
    }

    return content
  }

  /**
   * 替换列表页变量
   * @param {string} content 模板内容
   * @returns {string} 替换后的内容
   */
  replaceListVariables(content) {
    let result = content

    // 1. 替换字段相关的变量
    result = result.replace(/\{\{\s*fields\s*\}\}/g, JSON.stringify(this.fields))

    // 2. 替换表格配置
    const tableConfig = {
      // 表格列配置
      columns: this.fields.map((field) => ({
        field: field.name,
        title: `{{ trans("${field.label}") }}`,
        sortable: true,
      })),
      // 搜索配置
      search: {
        fields: this.fields
          .filter((field) => !['password', 'rich_editor'].includes(field.type))
          .map((field) => ({
            name: field.name,
            label: field.label,
            type: field.html_type,
          })),
      },
      // API 配置
      api: {
        list: `{{ route('${this.menu_path}/list') }}`,
        delete: `{{ route('${this.menu_path}/delete') }}`,
      },
    }
    result = result.replace(/\{\{\s*table_config\s*\}\}/g, JSON.stringify(tableConfig, null, 2))

    // 3. 替换权限检查变量
    const base_name = path.basename(this.menu_path)
    result = result.replace(/\{\{\s*permission_create\s*\}\}/g, `${base_name}.create`)
    result = result.replace(/\{\{\s*permission_edit\s*\}\}/g, `${base_name}.edit`)
    result = result.replace(/\{\{\s*permission_delete\s*\}\}/g, `${base_name}.delete`)
    result = result.replace(/\{\{\s*permission_view\s*\}\}/g, `${base_name}.view`)

    return result
  }

  /**
   * 替换创建页变量
   * @param {string} content 模板内容
   * @returns {string} 替换后的内容
   */
  replaceCreateVariables(content) {
    let result = content

    // 1. 替换字段相关的变量
    result = result.replace(/\{\{\s*fields\s*\}\}/g, JSON.stringify(this.fields))
    result = result.replace(/\{\{\s*has_rich_editor\s*\}\}/g, this.has_rich_editor.toString())
    result = result.replace(/\{\{\s*rich_editor_fields\s*\}\}/g, JSON.stringify(this.rich_editor_fields))

    // 2. 处理 @each 循环
    // Edge 模板引擎会处理这些循环，所以不需要在这里替换

    // 3. 处理条件语句
    // Edge 模板引擎会处理这些条件，所以不需要在这里替换

    // 4. 处理验证规则
    const validationRules = this.fields
      .map((field) => {
        if (Object.keys(field.validation).length === 0) return ''

        return `
        ${field.name}: {
          validators: ${JSON.stringify(field.validation)}
        }`
      })
      .filter((rule) => rule)
      .join(',\n')

    result = result.replace(/\{\{\s*validation_rules\s*\}\}/g, validationRules)

    return result
  }

  /**
   * 替换编辑页变量
   * @param {string} content 模板内容
   * @returns {string} 替换后的内容
   */
  replaceEditVariables(content) {
    // ... 编辑页的变量替换逻辑，类似于创建页 ...
    return content
  }

  /**
   * 替换查看页变量
   * @param {string} content 模板内容
   * @returns {string} 替换后的内容
   */
  replaceViewVariables(content) {
    // ... 查看页的变量替换逻辑 ...
    return content
  }

  /**
   * 替换后端文件变量
   * @param {string} content 模板内容
   * @param {string} template_name 模板文件名
   * @returns {string} 替换后的内容
   */
  replaceBackendVariables(content, template_name) {
    // ... 后端文件的变量替换逻辑 ...
    return content
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
}

module.exports = Generator
