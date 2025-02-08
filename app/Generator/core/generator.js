const fs = require('fs')
const path = require('path')
const { GeneratorError, ERROR_CODES, ERROR_MESSAGES } = require('./errors')
const Logger = require('../utils/logger')
const TemplateEngine = require('./template')
const SqlParser = require('./parser')
const { getTargetPath } = require('../config/paths')
const Database = use('Database')

class CodeGenerator {
  constructor() {
    this.templateEngine = new TemplateEngine()
    this.sqlParser = new SqlParser()
    this.baseDir = path.join(__dirname, '..')
    this.templatesDir = path.join(this.baseDir, 'templates/crud/base')
    this.options = {
      tempDir: path.join(this.baseDir, 'temp'),
    }
    this.logger = new Logger({ module: 'Generator' })
    this.generatedFiles = new Set() // 用于跟踪生成的文件
  }

  /**
   * 初始化生成器
   */
  async init() {
    try {
      await fs.promises.mkdir(this.options.tempDir, { recursive: true })
      this.logger.info('生成器初始化完成', { tempDir: this.options.tempDir })
      return { workDir: this.options.tempDir }
    } catch (error) {
      this.logger.error('生成器初始化失败', { error })
      throw new GeneratorError(ERROR_CODES.GENERATOR_INIT_ERROR, ERROR_MESSAGES[ERROR_CODES.GENERATOR_INIT_ERROR], 'generator_init')
    }
  }

  /**
   * 生成代码
   * @param {Object} params 生成参数
   * @returns {Promise<{files: string[]}>}
   */
  async generate(params) {
    try {
      this.logger.debug('开始生成代码', {
        moduleName: params.moduleName,
      })
      const startTime = process.hrtime()

      // 清空文件跟踪集合
      this.generatedFiles.clear()

      // 1. 验证参数
      this._validateParams(params)

      // 2. 生成前端代码
      this.logger.debug('开始生成前端代码')
      await this.generateFrontend(params)

      // 3. 生成后端代码
      this.logger.debug('开始生成后端代码')
      await this.generateBackend(params)

      // 4. 生成配置文件
      this.logger.debug('开始生成配置文件')
      await this.generateConfig(params)

      const [seconds, nanoseconds] = process.hrtime(startTime)
      this.logger.info('代码生成完成', {
        generationTime: seconds * 1000 + nanoseconds / 1000000,
        fileCount: this.generatedFiles.size,
        files: Array.from(this.generatedFiles),
      })

      // 5. 返回生成结果
      return {
        files: Array.from(this.generatedFiles),
      }
    } catch (error) {
      this.logger.error('代码生成失败', {
        error: error.message,
        params,
        generatedFiles: Array.from(this.generatedFiles),
      })

      if (error instanceof GeneratorError) {
        throw error
      }
      throw new GeneratorError(ERROR_CODES.GENERATOR_ERROR, `生成代码失败: ${error.message}`, 'generator_generate_error', {
        params,
        error: error.message,
        stack: error.stack,
      })
    }
  }

  /**
   * 生成前端代码
   * @private
   */
  async generateFrontend(params) {
    const startTime = process.hrtime()
    try {
      const { moduleName, sqlInfo } = params
      this.logger.debug('解析前端生成参数', { moduleName })

      // 验证字段信息
      if (!sqlInfo || !sqlInfo.fields || !Array.isArray(sqlInfo.fields) || sqlInfo.fields.length === 0) {
        throw new GeneratorError(ERROR_CODES.GENERATOR_ERROR, '缺少必需的模板变量: sqlInfo.fields', 'generator_generateFrontend_missing_fields', { sqlInfo })
      }

      // 1. 准备模板数据
      const templateData = await this._prepareTemplateData(params)
      this.logger.debug('模板数据准备完成', {
        fields: templateData.fields.length,
        options: Object.keys(templateData.options),
      })

      // 2. 生成前端文件
      const frontendTemplates = ['frontend/list.edge', 'frontend/create.edge', 'frontend/edit.edge', 'frontend/view.edge']
      for (const templateName of frontendTemplates) {
        const { dir, fileName } = getTargetPath('frontend', null, templateName, moduleName)
        await this._generateFile(templateName, dir, fileName, templateData)
      }

      const [seconds, nanoseconds] = process.hrtime(startTime)
      this.logger.info('前端代码生成完成', {
        generationTime: seconds * 1000 + nanoseconds / 1000000,
      })
    } catch (error) {
      this.logger.error('生成前端文件失败', {
        error: error.message,
        params,
      })

      if (error instanceof GeneratorError) {
        throw error
      }
      throw new GeneratorError(ERROR_CODES.GENERATOR_FRONTEND_ERROR, ERROR_MESSAGES[ERROR_CODES.GENERATOR_FRONTEND_ERROR], 'generator_frontend')
    }
  }

  /**
   * 生成后端代码
   * @private
   */
  async generateBackend(params) {
    try {
      const { moduleName, sqlInfo } = params

      // 1. 准备模板数据
      const templateData = await this._prepareTemplateData(params)

      // 2. 生成控制器和服务
      const backendConfig = {
        controllers: ['backend/Controller.js'],
        services: ['backend/Service.js'],
      }

      for (const [category, templates] of Object.entries(backendConfig)) {
        for (const templateName of templates) {
          const { dir, fileName } = getTargetPath('backend', category, templateName, moduleName)
          await this._generateFile(templateName, dir, fileName, templateData)
        }
      }

      // 3. 生成模型文件（为每个表生成一个模型文件）
      if (sqlInfo.tables && sqlInfo.tables.length > 0) {
        for (const table of sqlInfo.tables) {
          const { dir, fileName, skip_if_exists } = getTargetPath('backend', 'models', 'backend/Model.js', moduleName, table.name)

          // 如果设置了skip_if_exists且文件已存在，则跳过
          if (skip_if_exists && fs.existsSync(path.join(dir, fileName))) {
            this.logger.info(`跳过已存在的模型文件: ${fileName}`, {
              table: table.name,
              file: path.join(dir, fileName),
            })
            continue
          }

          // 准备该表的模型数据
          const modelData = {
            ...templateData,
            table_name: table.name,
            fields: sqlInfo.fields.filter((field) => {
              // 只包含属于当前表的字段
              const fieldTable = field.table || table.name
              return fieldTable === table.name
            }),
          }

          await this._generateFile('backend/Model.js', dir, fileName, modelData)
        }
      }
    } catch (error) {
      this.logger.error('生成后端文件失败', {
        error: error.message,
        params,
      })

      if (error instanceof GeneratorError) {
        throw error
      }
      throw new GeneratorError(ERROR_CODES.GENERATOR_BACKEND_ERROR, ERROR_MESSAGES[ERROR_CODES.GENERATOR_BACKEND_ERROR], 'generator_backend')
    }
  }

  /**
   * 生成配置文件
   * @private
   */
  async generateConfig(params) {
    try {
      const { moduleName } = params

      // 1. 准备模板数据
      const templateData = await this._prepareTemplateData(params)

      // 2. 生成配置文件（只生成路由配置）
      const configTemplates = {
        routes: ['config/routes.js'],
      }

      for (const [category, templates] of Object.entries(configTemplates)) {
        for (const templateName of templates) {
          const { dir, fileName, mode } = getTargetPath('config', category, templateName, moduleName)

          if (mode === 'append') {
            // 如果是追加模式，先读取原文件内容
            const content = await this.templateEngine.render(
              await this.templateEngine.loadTemplate(path.join(this.templatesDir, `${templateName}.tpl`)),
              templateData
            )

            // 追加到现有文件
            const targetPath = path.join(dir, fileName)
            if (fs.existsSync(targetPath)) {
              const originalContent = await fs.promises.readFile(targetPath, 'utf8')

              // 处理@position标记
              const lines = content.split('\n')
              let updatedContent = originalContent
              let currentPosition = ''
              let currentBlock = []

              for (const line of lines) {
                if (line.startsWith('// @position:')) {
                  // 如果有未处理的代码块，先插入到上一个位置
                  if (currentPosition && currentBlock.length > 0) {
                    updatedContent = this._insertAtPosition(updatedContent, currentPosition, currentBlock.join('\n'))
                  }
                  // 更新当前位置
                  currentPosition = line.replace('// @position:', '').trim()
                  currentBlock = []
                } else {
                  currentBlock.push(line)
                }
              }

              // 处理最后一个代码块
              if (currentPosition && currentBlock.length > 0) {
                updatedContent = this._insertAtPosition(updatedContent, currentPosition, currentBlock.join('\n'))
              }

              await fs.promises.writeFile(targetPath, updatedContent, 'utf8')
              this.generatedFiles.add(targetPath)
            } else {
              await this._generateFile(templateName, dir, fileName, templateData)
            }
          } else {
            await this._generateFile(templateName, dir, fileName, templateData)
          }
        }
      }

      // 3. 生成权限和菜单配置
      this.logger.debug('检查force_override参数:', {
        force_override: params.options?.force_override,
        params_keys: Object.keys(params),
        options_keys: Object.keys(params.options || {}),
      })

      if (!params.options?.force_override) {
        await this._generatePermissions(params)
      } else {
        this.logger.info('由于force_override=true，为了避免重复插入数据库，跳过生成权限和菜单配置')
      }
    } catch (error) {
      this.logger.error('生成配置文件失败', {
        error: error.message,
        params,
      })

      if (error instanceof GeneratorError) {
        throw error
      }
      throw new GeneratorError(ERROR_CODES.GENERATOR_CONFIG_ERROR, ERROR_MESSAGES[ERROR_CODES.GENERATOR_CONFIG_ERROR], 'generator_config')
    }
  }

  /**
   * 生成权限和菜单配置
   * @private
   */
  async _generatePermissions(params) {
    try {
      const { moduleName } = params
      this.logger.debug('开始生成权限和菜单配置', { moduleName })

      // 1. 准备模板数据
      const templateData = {
        module_name: moduleName,
        menu_url: moduleName.toLowerCase(),
      }

      // 2. 获取表模型
      const PrimaryMenusTable = require('@Table/primary_menus')
      const PermissionsTable = require('@Table/permissions')
      const RolePermissionsTable = require('@Table/role_permissions')
      const primaryMenusTable = new PrimaryMenusTable()
      const permissionsTable = new PermissionsTable()
      const rolePermissionsTable = new RolePermissionsTable()

      // 3. 在一个事务中执行所有操作
      await Database.transaction(async (trx) => {
        // 3.1 创建父菜单
        const parentResult = await primaryMenusTable.create(trx, {
          title: `${moduleName} manage`,
          title_cn: `${moduleName}管理`,
          url: null,
          icon: 'ki-file-document',
          parent_id: 0,
          sort: 10,
          level: 1,
          is_leaf: 0,
          spread: 0,
          status: 1,
        })

        if (!parentResult || parentResult.status === 0) {
          throw new Error('创建父菜单失败')
        }

        const parentId = parentResult.data.new_id
        this.logger.debug('父菜单创建成功', { parentId })

        // 3.2 创建子菜单
        const childResult = await primaryMenusTable.create(trx, {
          title: `${moduleName} list`,
          title_cn: `${moduleName}列表`,
          url: `/admin/${moduleName.toLowerCase()}/list`,
          icon: null,
          parent_id: parentId,
          sort: 10,
          level: 2,
          is_leaf: 1,
          spread: 0,
          status: 1,
        })

        if (!childResult || childResult.status === 0) {
          throw new Error('创建子菜单失败')
        }

        this.logger.info('菜单配置生成完成')

        // 3.3 创建权限记录
        const permissions = [
          // 菜单权限（4个）
          {
            name: `${moduleName}列表`,
            type: 'menu',
            key: `/admin/${moduleName.toLowerCase()}/list`,
            description: `${moduleName}管理-列表页面`,
          },
          {
            name: `${moduleName}查看`,
            type: 'menu',
            key: `/admin/${moduleName.toLowerCase()}/view/:id`,
            description: `${moduleName}管理-查看页面`,
          },
          {
            name: `${moduleName}编辑`,
            type: 'menu',
            key: `/admin/${moduleName.toLowerCase()}/edit/:id`,
            description: `${moduleName}管理-编辑页面`,
          },
          {
            name: `${moduleName}创建`,
            type: 'menu',
            key: `/admin/${moduleName.toLowerCase()}/create`,
            description: `${moduleName}管理-创建页面`,
          },
          // API权限（4个）
          {
            name: `获取${moduleName}列表`,
            type: 'api',
            key: `/api/${moduleName.toLowerCase()}/get-list`,
            description: `获取${moduleName}列表数据`,
          },
          {
            name: `创建${moduleName}`,
            type: 'api',
            key: `/api/${moduleName.toLowerCase()}/create-info`,
            description: `创建新${moduleName}`,
          },
          {
            name: `更新${moduleName}`,
            type: 'api',
            key: `/api/${moduleName.toLowerCase()}/update-info`,
            description: `更新${moduleName}信息`,
          },
          {
            name: `删除${moduleName}`,
            type: 'api',
            key: `/api/${moduleName.toLowerCase()}/remove`,
            description: `删除${moduleName}`,
          },
          // 元素权限（4个）
          {
            name: `${moduleName}编辑按钮`,
            type: 'element',
            key: `/admin/${moduleName.toLowerCase()}/list@edit`,
            description: `${moduleName}列表中的编辑按钮`,
          },
          {
            name: `${moduleName}删除按钮`,
            type: 'element',
            key: `/admin/${moduleName.toLowerCase()}/list@remove`,
            description: `${moduleName}列表中的删除按钮`,
          },
          {
            name: `${moduleName}创建按钮`,
            type: 'element',
            key: `/admin/${moduleName.toLowerCase()}/list@create`,
            description: `${moduleName}列表中的创建按钮`,
          },
          {
            name: `${moduleName}批量删除按钮`,
            type: 'element',
            key: `/admin/${moduleName.toLowerCase()}/list@batch-remove`,
            description: `${moduleName}列表中的批量删除按钮`,
          },
        ]

        const created_permission_ids = []
        for (const perm of permissions) {
          const result = await permissionsTable.create(trx, perm)
          if (result.status === 1 && result.data.new_id) {
            created_permission_ids.push(result.data.new_id)
          } else {
            throw new Error(`创建权限记录失败: ${result.msg}`)
          }
        }
        this.logger.info(`创建权限记录完成: ${permissions.length}个`)

        // 3.4 为超级管理员分配权限
        for (const permission_id of created_permission_ids) {
          const result = await rolePermissionsTable.create(trx, {
            role_id: 1, // 超级管理员角色ID
            permission_id: permission_id,
          })
          if (result.status !== 1) {
            throw new Error(`分配权限失败: ${result.msg}`)
          }
        }
        this.logger.info('为超级管理员分配权限完成')
      })

      this.logger.info('权限和菜单配置生成完成', {
        module_name: moduleName,
      })
    } catch (error) {
      this.logger.error('生成权限和菜单配置失败', {
        error: error.message,
        params,
      })
      throw new GeneratorError(ERROR_CODES.GENERATOR_CONFIG_ERROR, '生成权限和菜单配置失败', 'generator_permissions', { error: error.message })
    }
  }

  /**
   * 在指定位置插入代码
   * @private
   */
  _insertAtPosition(content, position, newCode) {
    const lines = content.split('\n')
    let insertIndex = -1

    // 根据position指令找到插入位置
    if (position.startsWith('after ')) {
      const targetLine = position.replace('after ', '').trim()
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(targetLine)) {
          insertIndex = i + 1
          break
        }
      }
    } else if (position.startsWith('before ')) {
      const targetLine = position.replace('before ', '').trim()
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(targetLine)) {
          insertIndex = i
          break
        }
      }
    }

    if (insertIndex !== -1) {
      // 在找到的位置插入新代码
      lines.splice(insertIndex, 0, newCode)
    } else {
      // 如果找不到指定位置，追加到文件末尾
      this.logger.warn(`找不到指定位置: ${position}，代码将被追加到文件末尾`)
      lines.push(newCode)
    }

    return lines.join('\n')
  }

  /**
   * 生成单个文件
   * @private
   */
  async _generateFile(templateName, targetDir, fileName, data) {
    const startTime = process.hrtime()
    try {
      this.logger.debug('开始生成文件', {
        template: templateName,
        targetFile: path.join(targetDir, fileName),
        dataKeys: Object.keys(data),
      })

      // 1. 加载模板
      const templatePath = path.join(this.templatesDir, `${templateName}.tpl`)
      const template = await this.templateEngine.loadTemplate(templatePath)

      // 2. 渲染模板
      const content = await this.templateEngine.render(template, data)

      // 3. 确保目标目录存在
      await fs.promises.mkdir(targetDir, { recursive: true })

      // 4. 写入文件
      const targetPath = path.join(targetDir, fileName)
      await fs.promises.writeFile(targetPath, content, 'utf8')

      // 5. 记录生成的文件
      this.generatedFiles.add(targetPath)

      const [seconds, nanoseconds] = process.hrtime(startTime)
      this.logger.info('文件生成成功', {
        template: templateName,
        target: targetPath,
        generationTime: seconds * 1000 + nanoseconds / 1000000,
      })
    } catch (error) {
      this.logger.error('生成文件失败', {
        template: templateName,
        targetDir,
        fileName,
        error: error.message,
      })

      if (error instanceof GeneratorError) {
        throw error
      }
      throw new GeneratorError(ERROR_CODES.GENERATOR_FILE_ERROR, ERROR_MESSAGES[ERROR_CODES.GENERATOR_FILE_ERROR], 'generator_file')
    }
  }

  /**
   * 准备模板数据
   * @private
   */
  async _prepareTemplateData(params) {
    try {
      const { moduleName, sqlInfo, primary_key } = params

      this.logger.debug('准备模板数据:', {
        moduleName,
        primary_key,
        tableCount: sqlInfo?.tables?.length,
        fieldCount: sqlInfo?.fields?.length,
      })

      // 验证字段信息
      if (!sqlInfo || !sqlInfo.fields || !Array.isArray(sqlInfo.fields) || sqlInfo.fields.length === 0) {
        throw new GeneratorError(ERROR_CODES.GENERATOR_ERROR, '缺少必需的模板变量: sqlInfo.fields', 'generator_prepareTemplateData_missing_fields')
      }

      // 获取主表信息
      const mainTable = sqlInfo.tables.find((table) => table.type === 'main')
      if (!mainTable || !mainTable.name) {
        throw new GeneratorError(ERROR_CODES.INVALID_SQL, ERROR_MESSAGES[ERROR_CODES.INVALID_SQL], 'generator_get_main_table_error')
      }

      // 1. 基础数据
      const data = {
        module_name: moduleName,
        table_name: mainTable.name,
        fields: sqlInfo.fields,
        options: params.options || {},
        has_create_permission: true,
        has_edit_permission: true,
        has_delete_permission: true,
        has_batch_delete_permission: true,
        timestamp: Date.now(), // 添加时间戳，用于生成固定的track值
      }

      this.logger.debug('模板数据准备完成:', {
        module_name: data.module_name,
        table_name: data.table_name,
        fieldCount: data.fields.length,
        options: Object.keys(data.options),
      })

      // 2. 如果指定了主键，添加主键相关配置
      if (primary_key) {
        data.primary_key = primary_key
        data.has_primary_key = true
        data.module_id_field = primary_key
        // 检查主键是否在字段列表中
        const primaryKeyField = data.fields.find((field) => field.original === primary_key || field.alias === primary_key)
        if (!primaryKeyField) {
          this.logger.warn('指定的主键字段不在SQL查询结果中', { primary_key, fields: data.fields })
        }
      } else {
        data.has_primary_key = false
      }

      // 3. 添加字段默认属性
      data.fields = data.fields.map((field) => ({
        listable: true,
        filterable: true,
        required: !field.nullable,
        min_width: '120px',
        ...field,
      }))

      // 4. 处理字段选项
      const fieldOptions = {}
      for (const field of data.fields) {
        // 如果是select类型的字段，从数据库表字段信息中获取选项
        if (field.form_type === 'select') {
          const tableField = sqlInfo.table_fields?.[mainTable.name]?.[field.original]
          if (tableField?.Comment) {
            // 解析字段注释中的选项信息，格式如: "状态：0-草稿，1-已发布"
            const options = this._parseOptionsFromComment(tableField.Comment)
            if (options.length > 0) {
              fieldOptions[field.alias] = options
            }
          }
        }
      }
      data.options = { ...data.options, ...fieldOptions }

      return data
    } catch (error) {
      throw new GeneratorError(ERROR_CODES.GENERATOR_ERROR, '准备模板数据失败', 'generator_prepareTemplateData_error', { params })
    }
  }

  /**
   * 从字段注释中解析选项
   * @private
   */
  _parseOptionsFromComment(comment) {
    try {
      // 检查注释中是否包含冒号
      const colonIndex = comment.indexOf('：')
      if (colonIndex === -1) return []

      // 获取冒号后面的部分
      const optionsStr = comment.slice(colonIndex + 1)

      // 按逗号分割
      return optionsStr.split('，').map((item) => {
        const [value, label] = item.split('-')
        return {
          value: value.trim(),
          label: label.trim(),
        }
      })
    } catch (err) {
      this.logger.warn('解析字段注释选项失败:', { comment, error: err })
      return []
    }
  }

  /**
   * 验证参数
   * @private
   */
  _validateParams(params) {
    if (!params) {
      throw new GeneratorError(ERROR_CODES.GENERATOR_PARAMS_ERROR, ERROR_MESSAGES[ERROR_CODES.GENERATOR_PARAMS_ERROR], 'generator_params_empty')
    }

    const { moduleName, sqlInfo } = params

    if (!moduleName) {
      throw new GeneratorError(ERROR_CODES.GENERATOR_PARAMS_ERROR, ERROR_MESSAGES[ERROR_CODES.GENERATOR_PARAMS_ERROR], 'generator_params_module')
    }

    if (!sqlInfo) {
      throw new GeneratorError(ERROR_CODES.GENERATOR_PARAMS_ERROR, ERROR_MESSAGES[ERROR_CODES.GENERATOR_PARAMS_ERROR], 'generator_params_sql')
    }
  }
}

module.exports = CodeGenerator
