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
      result = await parser.parse(sql)
      if (result.status === 0) {
        return Util.end2front({
          msg: result.msg,
          code: 9000,
        })
      }

      // 生成代码
      const { table_name, primary_key, fields, select_fields, joins } = result.data

      // 检查是否有富文本编辑器字段
      const rich_editor_fields = fields.filter((field) => field.type === 'rich_editor')

      // 初始化生成器
      this.generator.init(menu_path, fields, [], {})
      this.generator.has_rich_editor = rich_editor_fields.length > 0
      this.generator.rich_editor_fields = rich_editor_fields

      const data = {
        menu_path,
        table_name,
        primary_key,
        fields,
        select_fields,
        joins,
      }

      // 生成前端文件
      const frontend_templates = ['list', 'create', 'edit', 'view']
      for (let template of frontend_templates) {
        // 读取模板文件
        const template_path = path.join(__dirname, 'templates/frontend', template + '.edge.tpl')
        const template_content = fs.readFileSync(template_path, 'utf8')

        // 替换变量
        const content = await this.generator['replace' + Util.capitalize(template) + 'Variables'](template_content, data)

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
      const backend_templates = ['model', 'service', 'controller']
      for (let template of backend_templates) {
        // 读取模板文件
        const template_path = path.join(__dirname, 'templates/backend', template + '.js.tpl')
        const template_content = fs.readFileSync(template_path, 'utf8')

        // 替换变量
        const content = await this.generator['replace' + Util.capitalize(template) + 'Variables'](template_content, data)

        // 创建目录
        let dir = ''
        if (template === 'model') {
          dir = path.join(process.cwd(), 'app/Models/Table')
        } else if (template === 'service') {
          dir = path.join(process.cwd(), 'app/Services')
        } else if (template === 'controller') {
          dir = path.join(process.cwd(), 'app/Controllers/Http')
        }

        // 写入文件
        const class_name = this.generator.getClassName(menu_path)
        const file_name = class_name + Util.capitalize(template) + '.js'
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
