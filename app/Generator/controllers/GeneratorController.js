'use strict'

const Util = require('@Lib/Util')
const SqlParser = require('../core/parser')
const CodeGenerator = require('../core/generator')
const path = require('path')
const { ERROR_CODES, GeneratorError, ERROR_MESSAGES } = require('../core/errors')
const Logger = require('../utils/logger')
const fs = require('fs')

class GeneratorController {
  constructor() {
    this.logger = new Logger({ module: 'GeneratorController' })
    this.parser = new SqlParser()
    this.generator = new CodeGenerator()
  }

  /**
   * 显示代码生成器工具页面
   * @param {Object} ctx - 请求上下文
   */
  async tool({ view }) {
    try {
      this.logger.info('访问代码生成器页面')
      this.logger.debug('渲染工具页面')
      return view.render('../../app/Generator/views/tool')
    } catch (error) {
      this.logger.error('访问代码生成器页面失败', {
        error: error.message,
        stack: error.stack,
      })

      if (error instanceof GeneratorError) {
        return view.render('error.404', {
          error: error.message,
          track: error.track,
        })
      }

      return view.render('error.404', {
        error: ERROR_MESSAGES[ERROR_CODES.TEMPLATE_NOT_FOUND],
        track: 'tool_render_error',
      })
    }
  }

  /**
   * 预览SQL解析结果
   * @param {Object} ctx - 请求上下文
   */
  async previewSql({ request, response }) {
    try {
      const { sql } = request.all()
      this.logger.info('预览SQL解析结果', { sql })

      // 解析SQL
      this.logger.debug('开始解析SQL')
      const result = await this.parser.parse(sql)

      this.logger.info('SQL解析成功', {
        tableCount: result.tables?.length,
        fieldCount: result.fields?.length,
      })

      return response.json({
        code: 0,
        data: result,
      })
    } catch (error) {
      this.logger.error('SQL解析失败', {
        error: error.message,
        stack: error.stack,
        sql: request.input('sql'),
      })

      if (error instanceof GeneratorError) {
        return response.json({
          code: error.code,
          msg: error.message,
          track: error.track,
        })
      }

      return response.json({
        code: ERROR_CODES.INVALID_SQL,
        msg: ERROR_MESSAGES[ERROR_CODES.INVALID_SQL],
        track: 'preview_sql_error',
      })
    }
  }

  /**
   * 生成代码
   * @param {Object} ctx - 请求上下文
   */
  async generate({ request, response }) {
    try {
      const { sql, primary_key, menu_path, force_override } = request.all()
      this.logger.info('开始生成代码', { sql, primary_key, menu_path, force_override })

      // 1. 先解析SQL获取表信息
      this.logger.debug('开始解析SQL')
      const sqlInfo = await this.parser.parse(sql)
      this.logger.debug('SQL解析结果', {
        table: sqlInfo.table,
        fieldCount: sqlInfo.fields?.length,
      })

      // 2. 使用menu_path作为模块名（如果提供），否则使用SQL中的表名
      const moduleName = menu_path ? menu_path.split('/').pop() : this._getModuleNameFromSql(sqlInfo)
      this.logger.debug('获取模块名称', { moduleName, menu_path })

      // 3. 检查目标目录是否已存在
      const targetDir = path.join(process.cwd(), 'resources/views/admin', moduleName)
      if (fs.existsSync(targetDir) && !force_override) {
        return response.json({
          code: ERROR_CODES.DIRECTORY_EXISTS,
          msg: `目标目录 ${moduleName} 已存在，请使用其他名称或勾选"覆盖已存在的模块"选项`,
          track: 'generator_directory_exists',
        })
      }

      // 4. 如果需要覆盖，直接写入文件即可
      if (fs.existsSync(targetDir) && force_override) {
        this.logger.info('将覆盖已存在的目录', { targetDir })
      }

      // 5. 初始化生成器
      this.logger.debug('初始化代码生成器')
      await this.generator.init()

      // 6. 准备生成参数
      this.logger.debug('准备生成参数', {
        moduleName,
        table: sqlInfo.table,
        primary_key,
        force_override,
      })

      const params = {
        moduleName,
        sqlInfo,
        primary_key,
        options: {
          addTodoComments: true,
          has_create_permission: true,
          has_edit_permission: true,
          has_delete_permission: true,
          has_batch_delete_permission: true,
          force_override,
        },
      }

      // 7. 生成代码
      this.logger.debug('开始生成文件')
      const result = await this.generator.generate(params)

      this.logger.info('代码生成成功', {
        moduleName,
        fileCount: result.files.length,
        files: result.files,
        force_override,
      })

      return response.json({
        code: 0,
        msg: force_override ? '覆盖生成成功' : '生成成功',
        data: {
          module: moduleName,
          files: result.files,
        },
      })
    } catch (error) {
      this.logger.error('代码生成失败', {
        error: error.message,
        stack: error.stack,
        sql: request.input('sql'),
      })

      if (error instanceof GeneratorError) {
        return response.json({
          code: error.code,
          msg: error.message,
          track: error.track,
        })
      }

      return response.json({
        code: ERROR_CODES.UNKNOWN,
        msg: ERROR_MESSAGES[ERROR_CODES.UNKNOWN],
        track: 'generator_unknown_error',
      })
    }
  }

  /**
   * 从SQL信息中获取模块名称
   * @private
   */
  _getModuleNameFromSql(sqlInfo) {
    // 获取主表名称
    const mainTable = sqlInfo.tables.find((table) => table.type === 'main')
    if (!mainTable || !mainTable.name) {
      throw new GeneratorError(ERROR_CODES.INVALID_SQL, ERROR_MESSAGES[ERROR_CODES.INVALID_SQL], 'generator_get_module_name_error')
    }
    return mainTable.name
  }

  /**
   * 解析菜单路径（已废弃，改用SQL表名作为模块名）
   * @private
   * @deprecated
   */
  _parseModuleName(menuPath) {
    // 移除开头的斜杠
    const path = menuPath.replace(/^\/+/, '')
    // 获取第一段作为模块名
    const moduleName = path.split('/')[0]

    if (!moduleName) {
      throw new GeneratorError(ERROR_CODES.INVALID_PATH, ERROR_MESSAGES[ERROR_CODES.INVALID_PATH], 'generator_invalid_menu_path')
    }

    return moduleName
  }
}

module.exports = GeneratorController
