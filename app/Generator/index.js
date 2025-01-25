'use strict'

const Util = require('@Lib/Util')
const log = use('Logger')
const Parser = require('./parser')
const Generator = require('./generator')

/**
 * 显示代码生成工具页面
 */
async function showGeneratorPage(ctx) {
  try {
    return ctx.view.render('../../app/Generator/views/tool')
  } catch (err) {
    log.error(err)
    return ctx.view.render('error.404')
  }
}

/**
 * 处理代码生成请求
 */
async function generateCode(ctx) {
  try {
    const { menu_path, sql_query } = ctx.request.all()

    // 1. 验证菜单路径格式
    if (!menu_path.startsWith('/')) {
      throw new Error('菜单路径必须以 / 开头')
    }

    // 2. 从 SQL 查询中提取字段信息和表名
    const { fields, tables } = await Parser.extractFields(sql_query)

    // 3. 获取所有相关表的字段信息
    const tableFields = {}
    for (const table of tables) {
      const exists = await Parser.validateTable(table)
      if (!exists) {
        throw new Error(`表 ${table} 不存在`)
      }
      tableFields[table] = await Parser.getTableFields(table)
    }

    // 4. 生成代码
    const generator = new Generator(menu_path, fields, tables, tableFields)
    const result = await generator.generate()

    if (!result.status) {
      throw new Error(result.message)
    }

    return Util.end2front({
      msg: result.message,
      data: {
        menu_path,
        fields,
        tables,
        table_fields: tableFields,
      },
    })
  } catch (err) {
    return Util.error2front({
      msg: err.message,
      track: 'generator_generateCode_' + Date.now(),
    })
  }
}

module.exports = {
  showGeneratorPage,
  generateCode,
}
