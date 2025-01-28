'use strict'

const Util = require('@Lib/Util')
const parser = require('./parser')
const Generator = require('./generator')
const fs = require('fs')
const path = require('path')

class GeneratorController {
  constructor() {
    this.generator = new Generator()
  }

  /**
   * 显示工具页面
   */
  async tool(ctx) {
    try {
      return ctx.view.render('../../app/Generator/views/tool')
    } catch (err) {
      console.log(err)
      return ctx.view.render('error.404')
    }
  }

  /**
   * 生成代码
   */
  async generate(ctx) {
    try {
      let result = {}
      const { body } = ctx
      const { menu_path, sql } = body

      // 解析 SQL
      try {
        result = await parser.extractFields(sql)
      } catch (err) {
        return Util.end2front({
          msg: err.message,
          code: 9000,
        })
      }

      // 生成代码
      const { fields, tables } = result
      const table_name = tables[0].name
      const joins = tables.slice(1)

      // 检查是否有富文本编辑器字段
      const { has_rich_editor, rich_editor_fields } = result

      // 初始化生成器
      this.generator.init(menu_path, fields, [], {})
      this.generator.has_rich_editor = has_rich_editor
      this.generator.rich_editor_fields = rich_editor_fields

      const data = {
        menu_path,
        table_name,
        fields,
        select_fields: fields.map((f) => f.original),
        joins,
      }

      // 生成前端文件
      const frontend_templates = ['list', 'create', 'edit', 'view']
      for (let template of frontend_templates) {
        // 读取模板文件
        const template_path = path.join(__dirname, 'templates/frontend', template + '.edge.tpl')
        const template_content = fs.readFileSync(template_path, 'utf8')

        // 替换变量
        const method_name = 'replace' + this.generator.capitalize(template) + 'Variables'
        const content = await this.generator[method_name](template_content, data)

        // 创建目录
        const dir = path.join(process.cwd(), 'resources/views', menu_path.replace(/^\//, ''))
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        // 写入文件
        const file_path = path.join(dir, template + '.edge')
        fs.writeFileSync(file_path, content)
      }

      // 生成后端文件
      const backend_templates = ['table', 'service', 'controller']
      for (let template of backend_templates) {
        // 读取模板文件
        const template_path = path.join(__dirname, 'templates/backend', template + '.js.tpl')
        const template_content = fs.readFileSync(template_path, 'utf8')

        // 替换变量
        const method_name = 'replace' + this.generator.capitalize(template) + 'Variables'
        const content = await this.generator[method_name](template_content, data)

        // 创建目录
        let dir = ''
        let file_name = ''
        const class_name = this.generator.getClassName(menu_path)
        if (template === 'table') {
          dir = path.join(process.cwd(), 'app/Models/Table')
          file_name = table_name + '.js'
        } else if (template === 'service') {
          dir = path.join(process.cwd(), 'app/Services')
          file_name = class_name + 'Service.js'
        } else if (template === 'controller') {
          dir = path.join(process.cwd(), 'app/Controllers/Http')
          file_name = class_name + 'Controller.js'
        }

        // 写入文件
        const file_path = path.join(dir, file_name)
        fs.writeFileSync(file_path, content)
      }

      return Util.end2front({
        msg: '生成成功',
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'generator_generate_1738044181400',
      })
    }
  }
}

module.exports = GeneratorController
