'use strict'

/**
 * 代码生成器2.0路由配置
 * 遵循自包含原则，所有生成器相关的路由都在此文件中定义
 */

const Route = use('Route')

/**
 * 导出路由配置函数
 * @param {Object} Route Adonis路由对象
 */
module.exports = () => {
  // 代码生成器工具页面路由
  Route.group(() => {
    Route.get('tool', '../../Generator/controllers/GeneratorController.tool')
    Route.post('preview-sql', '../../Generator/controllers/GeneratorController.previewSql')
    Route.post('generate', '../../Generator/controllers/GeneratorController.generate')
  })
    .prefix('generator') // 统一前缀
    .middleware(['checkAuth']) // 使用视图权限验证中间件
}
