const { ERROR_CODES, GeneratorError } = require('./errors')
const Logger = require('../utils/logger')

/**
 * 字段增强器类
 * 用于增强SQL解析得到的字段信息,添加UI相关的属性
 */
class FieldEnhancer {
  constructor() {
    this.logger = new Logger({ module: 'FieldEnhancer' })

    // HTML input类型映射配置
    this.htmlTypeMap = {
      // 字段名包含以下关键字时的映射
      namePatterns: {
        email: 'email',
        phone: 'tel',
        mobile: 'tel',
        tel: 'tel',
        password: 'password',
      },
      // 基本类型到HTML类型的映射
      baseTypes: {
        number: 'number',
        datetime: 'date',
        string: 'text',
        boolean: 'checkbox',
      },
    }

    // 表单控件类型映射配置
    this.formTypeMap = {
      // 字段名包含以下关键字时的映射
      namePatterns: {
        password: 'password',
        status: 'select',
        type: 'select',
        _id: 'select', // 外键字段
        content: 'rich_editor', // 添加 content 字段的映射
        description: 'rich_editor', // 添加 description 字段的映射
      },
      // 数据库类型到表单控件类型的映射
      dbTypes: {
        text: 'rich_editor',
        longtext: 'rich_editor',
        varchar: (length) => (length > 255 ? 'textarea' : 'text'),
      },
    }

    // 特殊字段配置
    this.specialFields = {
      // 不可搜索的字段类型
      unsearchableTypes: ['rich_editor', 'password', 'file', 'image'],
      // 不可搜索的字段名模式
      unsearchablePatterns: {
        system: ['id', 'created_at', 'updated_at', 'deleted_at'],
        security: ['password'],
      },
      // 不可编辑的字段名模式
      unEditablePatterns: {
        system: ['id', 'created_at', 'updated_at', 'deleted_at'],
      },
      // 不显示在列表中的字段名模式
      unListablePatterns: {
        security: ['password'],
        system: ['deleted_at'],
      },
    }
  }

  /**
   * 增强字段信息
   * @param {Object} field - 基本字段信息
   * @param {Object} tableField - 数据库表字段信息
   * @returns {Object} 增强后的字段信息
   */
  enhance(field, tableField = null) {
    try {
      this.logger.debug('开始增强字段信息:', { field, tableField })

      // 检查参数
      if (!field) {
        this.logger.warn('字段信息为空')
        throw new GeneratorError(ERROR_CODES.FIELD_ENHANCE_ERROR, '字段信息不能为空', 'field_enhancer_enhance_empty')
      }

      // 确保field是对象类型
      if (typeof field !== 'object') {
        this.logger.warn('字段信息不是对象类型:', { type: typeof field })
        throw new GeneratorError(ERROR_CODES.FIELD_ENHANCE_ERROR, '字段信息必须是对象类型', 'field_enhancer_enhance_type')
      }

      // 确保必要的属性存在
      if (!field.original || !field.type) {
        this.logger.warn('字段信息缺少必要属性:', { field })
        throw new GeneratorError(ERROR_CODES.FIELD_ENHANCE_ERROR, '字段信息缺少original或type属性', 'field_enhancer_enhance_props')
      }

      // 1. 基本信息
      const enhanced = {
        ...field,
        name: field.name || field.alias || field.original, // 优先使用name，其次是alias，最后是original
        required: this._isRequired(field, tableField),
        comment: this._getComment(field, tableField),
        html_type: this._inferHtmlType(field.name, field.type),
        form_type: this._inferFormType(field.name, tableField),
        validation: {},
      }
      this.logger.debug('基本信息设置完成:', { enhanced })

      // 2. 可编辑性
      enhanced.editable = this._isEditable(enhanced)
      this.logger.debug('可编辑性设置完成:', { editable: enhanced.editable })

      // 3. 可列表显示性
      enhanced.listable = this._isListable(enhanced)
      this.logger.debug('可列表显示性设置完成:', { listable: enhanced.listable })

      // 4. 可搜索性 (依赖于 form_type)
      enhanced.searchable = this._isSearchable(enhanced)
      this.logger.debug('可搜索性设置完成:', { searchable: enhanced.searchable })

      // 5. 验证规则 (依赖于 form_type 和 required)
      this._addValidationRules(enhanced)
      this.logger.debug('验证规则设置完成:', { validation: enhanced.validation })

      this.logger.debug('字段增强完成:', { enhanced })
      return enhanced
    } catch (err) {
      this.logger.error('字段增强失败:', {
        error: err,
        field,
        tableField,
        stack: err.stack,
      })
      if (err instanceof GeneratorError) {
        throw err
      }
      throw new GeneratorError(ERROR_CODES.FIELD_ENHANCE_ERROR, `字段[${field?.name || 'unknown'}]增强失败: ${err.message}`, 'field_enhancer_enhance')
    }
  }

  /**
   * 判断字段是否必填
   * @private
   * @param {Object} field - 字段信息
   * @param {Object} tableField - 数据库表字段信息
   * @returns {boolean} 是否必填
   */
  _isRequired(field, tableField) {
    // 1. 如果是主键，必填
    if (tableField?.Key === 'PRI') {
      return true
    }

    // 2. 如果数据库定义为NOT NULL，必填
    if (tableField?.Null === 'NO') {
      return true
    }

    // 3. 如果字段名是id结尾，必填
    if (field.name.toLowerCase().endsWith('_id')) {
      return true
    }

    // 4. 如果是基础信息字段，必填
    const requiredFields = ['name', 'title', 'code']
    if (requiredFields.includes(field.name.toLowerCase())) {
      return true
    }

    return false
  }

  /**
   * 获取字段注释
   * @private
   * @param {Object} field - 字段信息
   * @param {Object} tableField - 数据库表字段信息
   * @returns {string} 字段注释
   */
  _getComment(field, tableField) {
    // 1. 优先使用数据库中的注释
    if (tableField?.Comment) {
      return tableField.Comment
    }

    // 2. 使用预定义的注释
    const commentMap = {
      id: '主键ID',
      name: '名称',
      title: '标题',
      code: '编码',
      type: '类型',
      status: '状态',
      remark: '备注',
      description: '描述',
      content: '内容',
      sort: '排序',
      parent_id: '父级ID',
      created_at: '创建时间',
      updated_at: '更新时间',
      deleted_at: '删除时间',
      email: '邮箱',
      phone: '电话',
      mobile: '手机',
      address: '地址',
      password: '密码',
      avatar: '头像',
      url: '链接',
      ip: 'IP地址',
      version: '版本号',
      is_enabled: '是否启用',
      is_deleted: '是否删除',
      is_default: '是否默认',
    }

    // 3. 尝试从字段名生成注释
    const name = field.name.toLowerCase()
    for (const [key, value] of Object.entries(commentMap)) {
      if (name === key || name.endsWith(`_${key}`)) {
        return value
      }
    }

    // 4. 使用字段名作为注释
    return field.name
  }

  /**
   * 从字段名和基本类型推断HTML input类型
   * @private
   * @param {string} fieldName - 字段名
   * @param {string} baseType - 基本类型
   * @returns {string} HTML input类型
   */
  _inferHtmlType(fieldName, baseType) {
    const name = fieldName.toLowerCase()

    // 1. 检查字段名模式
    for (const [pattern, type] of Object.entries(this.htmlTypeMap.namePatterns)) {
      if (name.includes(pattern)) {
        return type
      }
    }

    // 2. 使用基本类型映射
    return this.htmlTypeMap.baseTypes[baseType] || 'text'
  }

  /**
   * 从字段名和数据库信息推断表单控件类型
   * @private
   * @param {string} fieldName - 字段名
   * @param {Object} tableField - 数据库表字段信息
   * @returns {string} 表单控件类型
   */
  _inferFormType(fieldName, tableField) {
    try {
      const name = fieldName.toLowerCase()
      this.logger.debug('开始推断表单控件类型:', { name, tableField })

      // 1. 检查字段名模式
      for (const [pattern, type] of Object.entries(this.formTypeMap.namePatterns)) {
        if (name.includes(pattern)) {
          this.logger.debug('根据字段名匹配到表单类型:', {
            name,
            pattern,
            type,
          })
          return type
        }
      }

      // 2. 检查数据库类型
      if (tableField?.Type) {
        const type = tableField.Type.toLowerCase()
        for (const [dbType, formType] of Object.entries(this.formTypeMap.dbTypes)) {
          if (type.includes(dbType)) {
            const result = typeof formType === 'function' ? formType(this._extractLength(type)) : formType
            this.logger.debug('根据数据库类型匹配到表单类型:', {
              dbType,
              type,
              result,
            })
            return result
          }
        }
      }

      this.logger.debug('未匹配到特殊类型,使用默认类型:', { type: 'text' })
      return 'text'
    } catch (err) {
      this.logger.error('推断表单控件类型时出错:', {
        error: err,
        fieldName,
        tableField,
        stack: err.stack,
      })
      return 'text'
    }
  }

  /**
   * 从数据库类型中提取长度信息
   * @private
   * @param {string} dbType - 数据库类型,如 varchar(255)
   * @returns {number} 长度值
   */
  _extractLength(dbType) {
    const match = dbType.match(/\((\d+)\)/)
    return match ? parseInt(match[1]) : 0
  }

  /**
   * 判断字段是否可搜索
   * @private
   * @param {Object} field - 字段信息
   * @returns {boolean} 是否可搜索
   */
  _isSearchable(field) {
    try {
      this.logger.debug('开始判断字段是否可搜索:', {
        field_name: field.name,
        field_type: field.type,
        form_type: field.form_type,
        html_type: field.html_type,
      })

      // 防御性检查
      if (!field || !field.name) {
        this.logger.warn('字段信息不完整:', { field })
        return false
      }

      const name = field.name.toLowerCase()
      this.logger.debug('字段名转小写:', { name })

      // 1. 先检查字段名是否匹配不可搜索模式
      for (const [category, patterns] of Object.entries(this.specialFields.unsearchablePatterns)) {
        this.logger.debug('检查不可搜索模式:', { category, patterns })
        for (const pattern of patterns) {
          const matched = name.includes(pattern)
          this.logger.debug('模式匹配结果:', {
            name,
            pattern,
            matched,
            category,
          })
          if (matched) {
            this.logger.debug('字段名不可搜索:', {
              name,
              category,
              pattern,
            })
            return false
          }
        }
      }

      // 2. 再检查字段类型
      if (field.form_type) {
        const isUnsearchableType = this.specialFields.unsearchableTypes.includes(field.form_type)
        this.logger.debug('检查字段类型:', {
          form_type: field.form_type,
          unsearchableTypes: this.specialFields.unsearchableTypes,
          isUnsearchableType,
        })
        if (isUnsearchableType) {
          this.logger.debug('字段类型不可搜索:', {
            form_type: field.form_type,
            unsearchableTypes: this.specialFields.unsearchableTypes,
          })
          return false
        }
      }

      this.logger.debug('字段可搜索:', { field })
      return true
    } catch (err) {
      this.logger.error('判断字段是否可搜索时出错:', {
        error: err,
        field,
        stack: err.stack,
      })
      return false
    }
  }

  /**
   * 判断字段是否可编辑
   * @private
   * @param {Object} field - 字段信息
   * @returns {boolean} 是否可编辑
   */
  _isEditable(field) {
    try {
      const name = field.name.toLowerCase()

      // 检查字段名是否匹配不可编辑模式
      for (const [category, patterns] of Object.entries(this.specialFields.unEditablePatterns)) {
        for (const pattern of patterns) {
          if (name.includes(pattern)) {
            return false
          }
        }
      }

      return true
    } catch (err) {
      this.logger.error('判断字段是否可编辑时出错:', { error: err, field })
      return false
    }
  }

  /**
   * 判断字段是否可在列表中显示
   * @private
   * @param {Object} field - 字段信息
   * @returns {boolean} 是否可显示
   */
  _isListable(field) {
    try {
      const name = field.name.toLowerCase()

      // 检查字段名是否匹配不可显示模式
      for (const [category, patterns] of Object.entries(this.specialFields.unListablePatterns)) {
        for (const pattern of patterns) {
          if (name.includes(pattern)) {
            return false
          }
        }
      }

      return true
    } catch (err) {
      this.logger.error('判断字段是否可显示时出错:', { error: err, field })
      return false
    }
  }

  /**
   * 添加验证规则
   * @private
   * @param {Object} field - 字段信息
   */
  _addValidationRules(field) {
    // 1. 必填验证
    if (field.required) {
      field.validation.notEmpty = {
        message: 'please enter in the correct format',
      }
    }

    // 2. 根据HTML类型添加验证
    switch (field.html_type) {
      case 'email':
        field.validation.emailAddress = {
          message: 'please enter in the correct format',
        }
        break
      case 'tel':
        field.validation.phone = {
          message: 'please enter in the correct format',
        }
        break
      case 'url':
        field.validation.url = {
          message: 'please enter in the correct format',
        }
        break
      case 'number':
        field.validation.numeric = {
          message: 'please enter in the correct format',
        }
        break
    }

    // 3. 根据字段名添加验证
    const name = field.name.toLowerCase()
    if (name.includes('password')) {
      field.validation.password = {
        message: 'please enter in the correct format',
      }
    } else if (name.includes('email')) {
      field.validation.emailAddress = {
        message: 'please enter in the correct format',
      }
    } else if (name.includes('phone') || name.includes('mobile')) {
      field.validation.phone = {
        message: 'please enter in the correct format',
      }
    } else if (name.includes('url') || name.includes('link')) {
      field.validation.url = {
        message: 'please enter in the correct format',
      }
    } else if (name.includes('ip')) {
      field.validation.ip = {
        message: 'please enter in the correct format',
      }
    }
  }
}

module.exports = FieldEnhancer
