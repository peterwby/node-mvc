# Metronic 源文件目录

本目录包含 Metronic v9.1.2 Tailwind CSS 版本的源代码文件。这些文件用于：

1. 提供 Tailwind 插件和组件的实现
2. 定义主题和样式变量
3. 提供基础组件和布局模板

## 目录结构

- `app/`: 应用级别的 JavaScript 代码

  - 包含页面初始化、主题切换等功能
  - 提供全局工具函数和助手方法

- `core/`: 核心功能实现

  - `components/`: 基础组件实现
  - `plugins/`: Tailwind 插件定义
    - 包含按钮、表单、导航等组件的样式定义
    - 定义了响应式布局和主题系统

- `css/`: 样式文件

  - `styles.css`: 主样式文件
  - `demos/`: 各个演示主题的样式

- `vendors/`: 第三方资源
  - `keenicons/`: 图标字体文件
  - 其他第三方库和资源

## 使用说明

1. 这些源文件主要通过 Tailwind 的构建系统使用：

   - 插件通过 `tailwind.config.js` 加载
   - 样式通过 `resources/css/app.css` 导入

2. 不要直接修改这些文件，而是：

   - 在 `resources/css/app.css` 中添加自定义样式
   - 在 `resources/views` 中创建自己的模板
   - 在 `public/assets` 中添加自己的静态资源

3. 版本更新：
   - 记录当前使用的版本：v9.1.2
   - 更新时注意保持目录结构一致
   - 更新后可能需要重新配置 Tailwind
