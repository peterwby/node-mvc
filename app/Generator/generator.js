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
}

module.exports = Generator
