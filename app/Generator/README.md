# 代码生成器

基于 Adonis.js v4.1 的代码生成器，用于快速生成 MVC 架构的前后端代码。

## 功能特点

1. 基于 SQL 查询自动生成：

   - 前端页面（list/create/edit/view）
   - 后端代码（Controller/Service/Table）
   - 系统配置（路由、菜单、权限）

2. 支持的字段类型：

   - text：文本输入框
   - select：下拉选择框
   - textarea：多行文本框
   - rich_editor：富文本编辑器
   - password：密码输入框
   - boolean：布尔值（是/否）
   - datetime：日期时间
   - 其他类型默认使用文本输入框

3. 自动生成的功能：
   - 列表页：搜索、排序、分页、批量操作
   - 表单页：字段验证、富文本编辑器
   - 权限控制：基于角色的访问控制
   - 国际化：所有文本使用 trans 函数包装

## 使用方法

1. 准备 SQL 查询语句，例如：

   ```sql
   SELECT
     a.id,
     a.title,
     a.content,
     a.type,
     a.status,
     a.priority,
     a.publish_time
   FROM news a
   ```

2. 访问代码生成工具页面：

   - 路径：/admin/generator/tool
   - 输入菜单路径（例如：/admin/news）
   - 粘贴 SQL 查询语句
   - 点击生成按钮

3. 生成的文件结构：

   ```
   resources/views/admin/news/
   ├── list.edge    # 列表页
   ├── create.edge  # 创建页
   ├── edit.edge    # 编辑页
   └── view.edge    # 查看页

   app/Controllers/Http/
   └── NewsController.js

   app/Services/
   └── NewsService.js

   app/Models/Table/
   └── news.js
   ```

## 模板系统

1. 模板文件位置：

   ```
   app/Generator/templates/
   ├── frontend/      # 前端模板
   │   ├── list.edge.tpl
   │   ├── create.edge.tpl
   │   ├── edit.edge.tpl
   │   └── view.edge.tpl
   └── backend/       # 后端模板
       ├── controller.js.tpl
       ├── service.js.tpl
       └── table.js.tpl
   ```

2. 模板变量：

   - `{{ menu_path }}`：菜单路径（例如：/admin/news）
   - `{{ api_path }}`：API 路径（例如：news）
   - `{{ primary_key }}`：主键字段名
   - `{{ field_headers }}`：表格标题列
   - `{{ field_columns }}`：表格数据列
   - `{{ column_defs }}`：DataTable 列定义
   - `{{ checkbox_th }}`：复选框列标题
   - `{{ checkbox_td }}`：复选框列数据
   - `{{ operation_th }}`：操作列标题
   - `{{ operation_td }}`：操作列数据

3. 字段渲染：

   ```javascript
   // 布尔值
   render: (value) => (value ? trans('yes') : trans('no'))

   // 下拉列表
   render: (value) => getDictLabel('dict_table_name', value)

   // 日期时间
   render: (value) => moment(value).format('YYYY-MM-DD HH:mm:ss')

   // 富文本
   render: (value) => escapeHtml(value)
   ```

## 开发规范

1. 命名规范：

   - 类名：使用 PascalCase（例如：NewsController）
   - 方法名：使用 camelCase（例如：getList）
   - 路由：使用连字符（例如：/admin/news/get-list）
   - 文件名：使用下划线（例如：news_controller.js）

2. 错误处理：

   - 使用统一的错误类和错误代码
   - 所有错误消息都要清晰明确
   - 区分用户错误和系统错误
   - 关键操作要有错误追踪信息

3. 国际化：

   - 所有面向用户的文本都要使用 trans 函数
   - 翻译文件位于项目根目录的 trans.json
   - 翻译 key 要有意义且易于理解

4. 权限控制：
   - 所有操作按钮都要进行权限检查
   - 权限 key 格式：/admin/news/list@create
   - 自动为超级管理员分配所有权限

## 注意事项

1. 生成代码前：

   - 确保 SQL 查询语句正确
   - 检查字段类型是否合适
   - 确认菜单路径的正确性

2. 生成代码后：

   - 检查生成的文件是否完整
   - 测试所有功能是否正常
   - 确认权限配置是否正确
   - 检查国际化文本是否完整

3. 可能的问题：
   - 字段名冲突
   - 权限 key 重复
   - 翻译 key 重复
   - 路由冲突

## 扩展开发

1. 添加新的字段类型：

   - 在 replaceListVariables 方法中添加渲染逻辑
   - 在模板文件中添加相应的表单控件
   - 在验证规则中添加相应的验证逻辑

2. 修改生成的代码：

   - 编辑相应的模板文件
   - 修改生成器中的变量替换逻辑
   - 更新 README.md 文档

3. 添加新的功能：
   - 在生成器类中添加新的方法
   - 创建新的模板文件
   - 更新路由和权限配置

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
