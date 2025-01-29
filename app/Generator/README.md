# 代码生成器

代码生成器是一个基于 SQL 查询的前后端代码生成工具，可以快速生成基于 Adonis.js v4.1 的 CRUD 模块。

## 功能特点

- 🚀 一键生成完整的前后端代码
- 📝 支持多种字段类型（文本、数字、日期、布尔值、下拉列表、富文本等）
- 🔍 智能生成搜索条件和表单验证规则
- 🎨 生成美观的前端界面，基于 Metronic v9.1.2
- 🌐 支持国际化，自动使用翻译函数
- 📊 支持复杂的数据库查询，包括多表关联

## 目录结构

```
app/Generator/
├── templates/          # 模板文件
│   ├── frontend/      # 前端模板
│   │   ├── list.edge.tpl
│   │   ├── create.edge.tpl
│   │   ├── edit.edge.tpl
│   │   └── view.edge.tpl
│   └── backend/       # 后端模板
│       ├── controller.js.tpl
│       ├── service.js.tpl
│       └── model.js.tpl
├── views/             # 工具页面视图
│   ├── layouts/      # 布局文件
│   │   └── generator.edge
│   └── tool.edge      # 代码生成工具的页面
├── index.js           # 入口文件
├── parser.js          # SQL解析器
├── generator.js       # 代码生成器核心
└── logger.js          # 日志记录器
```

## 快速开始

1. 访问代码生成工具页面：

```javascript
// 在 start/routes.js 中添加路由
Route.get('generator/tool', 'GeneratorController.tool').middleware(['auth'])
```

2. 输入必要的参数：

- 菜单路径：生成文件的目标路径，如 `admin/users`
- SQL 查询：用于获取字段信息的 SQL 查询语句，如：
  ```sql
  SELECT
    u.id,
    u.username,
    u.email,
    u.created_at,
    r.name as role_name
  FROM users u
  LEFT JOIN roles r ON u.role_id = r.id
  ```

3. 点击"生成代码"按钮，工具将自动生成：

- 前端文件

  - `resources/views/admin/users/list.edge`：列表页
  - `resources/views/admin/users/create.edge`：创建页
  - `resources/views/admin/users/edit.edge`：编辑页
  - `resources/views/admin/users/view.edge`：查看页

- 后端文件
  - `app/Controllers/Http/Admin/UsersController.js`：控制器
  - `app/Services/Admin/UsersService.js`：服务层
  - `app/Models/Table/Users.js`：数据表模型

## 字段类型

代码生成器会根据字段名、SQL 类型和注释自动判断字段类型：

| 字段类型    | 说明           | 示例                 |
| ----------- | -------------- | -------------------- |
| text        | 文本输入框     | username, title      |
| number      | 数字输入框     | age, price           |
| select      | 下拉列表       | status, type         |
| datetime    | 日期时间选择器 | created_at           |
| boolean     | 开关/复选框    | is_active            |
| rich_editor | 富文本编辑器   | content, description |

### 字段类型判断规则

1. 根据字段名判断：

```javascript
const searchableNames = ['name', 'title', 'description', 'content', 'code', 'remark']
const searchableTypes = ['string', 'text', 'varchar']
```

2. 根据 SQL 类型判断：

```javascript
if (def.match(/^(count|sum|avg|min|max)\s*\(/i)) return 'number'
if (def.match(/\b(datetime|timestamp)\b/i)) return 'datetime'
if (def.match(/\b(bool|boolean)\b/i)) return 'boolean'
```

3. 根据字段注释判断：

```javascript
// 搜索字段
if (field.comment?.includes('搜索')) isSearchable = true
// 下拉列表
if (field.comment?.includes('dict:')) dictTable = field.comment.match(/dict:(\w+)/)[1]
```

## 配置项

### 1. 模板变量

在模板文件中可以使用以下变量：

```javascript
// 通用变量
{
  {
    menu_path
  }
} // 菜单路径
{
  {
    table_name
  }
} // 表名
{
  {
    module_name
  }
} // 模块名

// 列表页变量
{
  {
    list_fields
  }
} // 列表字段配置
{
  {
    search_fields
  }
} // 搜索字段配置

// 表单页变量
{
  {
    form_fields
  }
} // 表单字段配置
{
  {
    rules
  }
} // 验证规则
```

### 2. 日志配置

日志文件保存在 `tmp/logs` 目录下，格式为 `generator_YYYYMMDD.log`：

```javascript
// 日志格式
[2024-03-15T10:30:00.000Z] INFO: 开始生成代码
[2024-03-15T10:30:01.000Z] ERROR: 文件创建失败
```

### 3. 错误处理

错误日志包含以下信息：

```javascript
{
  time: '2024-03-15T10:30:00.000Z',
  type: 'error',
  message: '文件创建失败',
  stack: 'Error: 文件创建失败\n    at Generator.createFile ...',
  track: 'generator_createFile_1234567890123'
}
```

## 最佳实践

1. SQL 查询建议：

   - 使用有意义的字段别名
   - 添加注释说明字段用途
   - 合理使用表别名

2. 目录结构建议：

   - 按模块组织文件
   - 保持命名一致性
   - 遵循项目规范

3. 代码生成后建议：
   - 检查生成的代码
   - 调整字段顺序
   - 添加特定业务逻辑
   - 完善错误处理

## 常见问题

1. 字段类型判断不准确？

   - 检查字段名是否符合规范
   - 在 SQL 中添加适当的注释
   - 手动修改生成的代码

2. 生成的代码不符合要求？

   - 检查模板文件是否正确
   - 调整模板中的变量
   - 修改生成器的配置

3. 日志文件太大？
   - 定期清理旧日志
   - 调整日志级别
   - 配置日志轮转

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交代码
4. 发起 Pull Request

## 许可证

MIT
