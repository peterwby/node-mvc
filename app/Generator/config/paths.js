const path = require('path')

/**
 * 目标目录配置
 * @type {Object}
 */
const TARGET_DIRS = {
  // 前端代码目录配置
  frontend: {
    base: 'resources/views/admin',
    templates: {
      'frontend/list.edge': 'list.edge',
      'frontend/create.edge': 'create.edge',
      'frontend/edit.edge': 'edit.edge',
      'frontend/view.edge': 'view.edge',
    },
  },

  // 后端代码目录配置
  backend: {
    controllers: {
      base: 'app/Controllers/Http',
      templates: {
        'backend/Controller.js': (moduleName) => `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Controller.js`,
      },
    },
    services: {
      base: 'app/Services',
      templates: {
        'backend/Service.js': (moduleName) => `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Service.js`,
      },
    },
    models: {
      base: 'app/Models/Table',
      templates: {
        'backend/Model.js': (tableName) => `${tableName.toLowerCase()}.js`,
      },
      // 特殊标记：表示这个目录下的文件是按表名生成的，不使用moduleName
      mode: 'table_based',
      // 如果文件已存在则跳过
      skip_if_exists: true,
    },
  },

  // 配置文件目录配置
  config: {
    routes: {
      base: 'start',
      templates: {
        'config/routes.js': 'routes.js',
      },
      mode: 'append', // 表示这个文件是追加内容而不是创建新文件
    },
  },
}

/**
 * 获取目标文件的完整路径
 * @param {string} category 类别(frontend/backend/config)
 * @param {string} subCategory 子类别(controllers/services等)
 * @param {string} templateName 模板名称
 * @param {string} moduleName 模块名称
 * @param {string} [tableName] 表名（仅在生成模型文件时使用）
 * @returns {Object} 包含目标路径和文件名的对象
 */
function getTargetPath(category, subCategory, templateName, moduleName, tableName) {
  const config = subCategory ? TARGET_DIRS[category][subCategory] : TARGET_DIRS[category]
  if (!config) {
    throw new Error(`Invalid category or subcategory: ${category}/${subCategory}`)
  }

  const template = config.templates[templateName]
  if (!template) {
    throw new Error(`Template not found: ${templateName}`)
  }

  // 如果是表模型，使用tableName而不是moduleName
  const nameToUse = config.mode === 'table_based' ? tableName : moduleName
  const fileName = typeof template === 'function' ? template(nameToUse) : template

  // 如果是前端页面，才需要创建以moduleName命名的子目录
  const targetDir = category === 'frontend' ? path.join(process.cwd(), config.base, moduleName.toLowerCase()) : path.join(process.cwd(), config.base)

  return {
    dir: targetDir,
    fileName,
    mode: config.mode || 'create', // 默认为create模式
    skip_if_exists: config.skip_if_exists || false, // 是否在文件存在时跳过
  }
}

module.exports = {
  TARGET_DIRS,
  getTargetPath,
}
