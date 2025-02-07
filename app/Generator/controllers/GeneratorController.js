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
      const { sql, primary_key } = request.all()
      this.logger.info('预览SQL解析结果', { sql, primary_key })

      // 解析SQL
      this.logger.debug('开始解析SQL')
      const result = await this.parser.parse(sql)

      // 如果提供了primary_key,标记主键字段
      if (primary_key) {
        result.fields = result.fields.map((field) => ({
          ...field,
          is_primary: field.name === primary_key,
        }))
      }

      // 添加更多调试信息
      this.logger.info('SQL解析成功', {
        tableCount: result.tables?.length,
        fieldCount: result.fields?.length,
        primary_key,
        has_rich_editor: result.has_rich_editor,
        rich_editor_fields: result.rich_editor_fields?.map((f) => f.name),
      })

      // 格式化返回结果
      const preview = {
        // 表信息
        tables: result.tables.map((table) => ({
          name: table.name,
          alias: table.alias,
          type: table.type,
          join_condition: table.on,
        })),
        // 字段信息
        fields: result.fields.map((field) => ({
          name: field.name,
          original: field.original,
          type: field.type,
          is_primary: field.is_primary || false,
          form_type: field.form_type,
          list_type: field.list_type,
          searchable: field.searchable,
          sortable: field.sortable,
        })),
        // 配置信息
        config: {
          has_rich_editor: result.has_rich_editor,
          primary_key: primary_key || null,
        },
        // 将生成的文件列表
        files: [
          {
            type: 'frontend',
            files: [
              'resources/views/admin/{module}/list.edge',
              'resources/views/admin/{module}/create.edge',
              'resources/views/admin/{module}/edit.edge',
              'resources/views/admin/{module}/view.edge',
            ],
          },
          {
            type: 'backend',
            files: ['app/Controllers/Http/Admin/{Module}Controller.js', 'app/Services/{Module}Service.js', 'app/Models/{Module}.js'],
          },
          {
            type: 'config',
            files: ['start/routes.js'],
          },
        ],
        // 将执行的数据库操作
        database: {
          // 菜单记录
          menus: [
            {
              operation: 'INSERT',
              table: 'primary_menus',
              data: {
                title: `${result.tables[0].name} manage`,
                title_cn: `${result.tables[0].name}管理`,
                url: null,
                icon: 'ki-file-document',
                parent_id: 0,
                sort: 10,
                level: 1,
                is_leaf: 0,
                spread: 0,
                status: 1,
              },
            },
            {
              operation: 'INSERT',
              table: 'primary_menus',
              data: {
                title: `${result.tables[0].name} list`,
                title_cn: `${result.tables[0].name}列表`,
                url: '/admin/{module}/list',
                icon: null,
                parent_id: '${parent_id}', // 这里用占位符,实际生成时会替换为上一条记录的ID
                sort: 10,
                level: 2,
                is_leaf: 1,
                spread: 0,
                status: 1,
              },
            },
          ],
          // 权限记录
          permissions: [
            // 菜单权限（4个）
            {
              operation: 'INSERT',
              table: 'permissions',
              data: {
                name: `${result.tables[0].name}列表`,
                type: 'menu',
                key: '/admin/{module}/list',
                description: `${result.tables[0].name}管理-列表页面`,
              },
            },
            {
              operation: 'INSERT',
              table: 'permissions',
              data: {
                name: `${result.tables[0].name}查看`,
                type: 'menu',
                key: '/admin/{module}/view/:id',
                description: `${result.tables[0].name}管理-查看页面`,
              },
            },
            {
              operation: 'INSERT',
              table: 'permissions',
              data: {
                name: `${result.tables[0].name}编辑`,
                type: 'menu',
                key: '/admin/{module}/edit/:id',
                description: `${result.tables[0].name}管理-编辑页面`,
              },
            },
            {
              operation: 'INSERT',
              table: 'permissions',
              data: {
                name: `${result.tables[0].name}创建`,
                type: 'menu',
                key: '/admin/{module}/create',
                description: `${result.tables[0].name}管理-创建页面`,
              },
            },
            // API权限（4个）
            {
              operation: 'INSERT',
              table: 'permissions',
              data: {
                name: `获取${result.tables[0].name}列表`,
                type: 'api',
                key: '/api/{module}/get-list',
                description: `获取${result.tables[0].name}列表数据`,
              },
            },
            {
              operation: 'INSERT',
              table: 'permissions',
              data: {
                name: `创建${result.tables[0].name}`,
                type: 'api',
                key: '/api/{module}/create-info',
                description: `创建新${result.tables[0].name}`,
              },
            },
            {
              operation: 'INSERT',
              table: 'permissions',
              data: {
                name: `更新${result.tables[0].name}`,
                type: 'api',
                key: '/api/{module}/update-info',
                description: `更新${result.tables[0].name}信息`,
              },
            },
            {
              operation: 'INSERT',
              table: 'permissions',
              data: {
                name: `删除${result.tables[0].name}`,
                type: 'api',
                key: '/api/{module}/remove',
                description: `删除${result.tables[0].name}`,
              },
            },
            // 元素权限（4个）
            {
              operation: 'INSERT',
              table: 'permissions',
              data: {
                name: '编辑按钮',
                type: 'element',
                key: '/admin/{module}/list@edit',
                description: `${result.tables[0].name}列表中的编辑按钮`,
              },
            },
            {
              operation: 'INSERT',
              table: 'permissions',
              data: {
                name: '删除按钮',
                type: 'element',
                key: '/admin/{module}/list@remove',
                description: `${result.tables[0].name}列表中的删除按钮`,
              },
            },
            {
              operation: 'INSERT',
              table: 'permissions',
              data: {
                name: '创建按钮',
                type: 'element',
                key: '/admin/{module}/list@create',
                description: `${result.tables[0].name}列表中的创建按钮`,
              },
            },
            {
              operation: 'INSERT',
              table: 'permissions',
              data: {
                name: '批量删除按钮',
                type: 'element',
                key: '/admin/{module}/list@batch-remove',
                description: `${result.tables[0].name}列表中的批量删除按钮`,
              },
            },
          ],
          // 角色权限关联
          role_permissions: [
            {
              operation: 'INSERT',
              table: 'role_permissions',
              data: {
                role_id: 1, // 超级管理员角色ID
                permission_id: '${permission_id}', // 这里用占位符,实际生成时会替换为权限记录的ID
              },
              description: '为超级管理员分配权限',
            },
          ],
        },
      }

      return response.json({
        code: 0,
        data: preview,
      })
    } catch (error) {
      this.logger.error('SQL解析失败', {
        error: error.message,
        stack: error.stack,
        sql: request.input('sql'),
        primary_key: request.input('primary_key'),
      })

      if (error instanceof GeneratorError) {
        return response.json({
          code: error.code,
          msg: error.message,
          track: error.track,
          data: {
            line: error.line,
            position: error.position,
            context: error.context,
          },
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
