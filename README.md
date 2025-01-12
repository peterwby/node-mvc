# Node.js 后端 MVC 框架

## 简介

- 本项目的地址：https://gitee.com/sh-chanson/node-server.git
- 基于 Adonis.js v4.1 框架，其官方文档地址：https://adonisjs.com/docs/4.1/folder-structure
- 实际项目一般采用前后端分离开发，View 交给前端处理， 本框架的结构：Router->Controllers->Services->Models
- models 层使用 query builder，基于 knex，不适用 ORM
- 本框架可以作为纯后端，提供 api 给前端调用。也可以作为全栈框架直接渲染 html 输出到前端
- 集成了 Metronic v9.1.2 后台管理系统（Tailwind CSS 版本）
  - 管理系统位于 `/resources/views/admin/**`
  - 样式源文件位于 `/resources/metronic`
  - 静态资源位于 `/public/assets`
  - 使用 Tailwind CLI 进行样式构建

## 须具备知识

- node.js（最好用过类似 express、koa、egg.js 等框架）
- 熟悉 MVC 知识
- 熟悉 es6 语法
- 熟悉 sql 语法

## 准备工作

- 安装 node.js（v12 以上版本）https://nodejs.org/en/

###### 安装常用全局包

（windows 下无需 sudo 这 4 个字母）

- adonis 必须的全局包
  sudo npm i -g @adonisjs/cli
- 源管理器
  sudo npm i -g nrm
- 切换国内源
  sudo nrm use taobao
- 其他全局包
  sudo npm i -g live-server

## 项目安装

###### git clone 项目后，在根目录下：

1. 安装项目的依赖

```
sudo npm i
```

2. 首次运行项目时

```
npm run init
```

3. 记得把.env 文件复制到项目根目录下

- 找管理员要.env 配置文件

4. 启动项目（开发环境）

```
npm run dev
```

## 项目结构说明

- 数据的流转的一般顺序是：前端发来请求 -> Router -> Controllers -> Services -> Models
- /start/routes.js：(Router)此文件用来处理路由，并绑定相应的 Controller
- /app/Controllers/Http/PC/：(Controller) 所有 Controller 文件都放在这里
- /app/Services/：(Service) 所有 Services 文件都放在这里，且都继承于 BaseService 基类
- /app/Models/Table/：(Model) 所有的数据库表信息都放在这里，文件名应跟数据库上真实表文件名相同，且都继承于 BaseTable 基类，BaseTable 基类定义了一组常用的数据库操作。
- /config/：Adonis 的配置目录，可以对不同模块进行配置
- /.env：项目的配置文件
- /app/Lib/Util.js：常用工具库，包含对数组、对象、字符串、时间等处理的函数。优先使用此工具库（而不是安装第三方库）
- /app/Lib/Request.js：基于 axios.js 的 HTTP 库，用于 get、post 方式访问 url
- /resources/views/ : Adonis 框架中用于存放静态文件的目录

## 代码规范

- 使用 prettier 规范代码格式
- API 的 method 默认使用 POST，只有少数展示数据的接口或下载类的接口使用 GET。比如：
  Route.get('download/:type/:file', 'PC/DownloadController.download')
  Route.post('entity/edit', 'PC/EntityController.edit')
  Route.post('entity/get-table', 'PC/EntityController.getTable')
  Route.post('entity/get-table-common', 'PC/EntityController.getTableCommon')
- Class 的名称用大驼峰风格：比如 UserController
- 函数名称用小驼峰风格：比如 getUserInfo()
- 路由、 URL 用连字符：比如 get-user-info
- 文件名称用下划线连接，比如 hello_world.txt
- 变量、json、css 里的 key 用下划线连接：比如 let user_info = { user_name: 'xxx' }

## 约定

- 常见的页面分为列表页（比如文章列表、用户列表）和详情页（比如文章编辑页、用户信息编辑页）
- 列表页一般都有 2 个接口，一个是公共接口，比如 get-table-common（返回页面上的一些公共信息），一个是 get-table（返回表格数据）
- 详情页一般都有 2 个接口，一个是公共接口 get-edit-common（返回页面上的一些公共信息），一个是提交接口，比如 edit、create 等

## 常用操作

- 熟悉 Util.js 里的函数，有需求时优先使用里面的函数，而不是另外写一个

- 获取前端 get 和 post 方法传递过来的参数

  ```
  ctx.request.all()
  ```

- session 的操作
  ```
  ctx.session.get('user')
  ctx.session.put('user', {name:'xxx'})
  ```
- redis 的操作

  ```
  await Redis.get(key)//返回字符串
  await Redis.set(key, JSON.stringify(data))//对象要先转成字符串
  await Redis.expire(key, 40000)//有效期
  ```

- 每个函数正常结束时调用。用途：规范函数的返回值，使得返回值具有相同的数据结构

  ```
  Util.end({})
  ```

- 每个函数内部抛出异常时，在 catch 里调用本函数，使得返回值具有相同的数据结构
  ```
  Util.error({})
  ```
- Controller 里的函数正常结束时调用。规范要返回给前端的数据结构
  ```
  Util.end2front({})
  ```
- Controller 里的函数内部抛出异常时，在 catch 里调用本函数，规范要返回给前端的数据结构
  ```
  Util.error2front({})
  ```
- 对返回前端的 id(数字型) 进行加解密，用于某些不希望前端直接看到内容的场景，比如 user_id
  ```
  Util.encode(int)
  Util.decode(str)
  ```
- 打印信息到控制台

  ```
  log.debug('调试时建议用这个')
  log.info('普通信息')
  log.error('错误信息')
  ```

## 常用快捷操作

> （根目录/.vscode/nodejs.code-snippets）请熟悉这个文件里的。自定义了一些代码片段，比如输入 func，vscode 就会智能提示 funcController... 按下 tab 键，就会把 controller 下的函数结构补全

- func：
  funcController（创建一个 Controller 里的函数）、funcService（创建一个 Service 里的函数）、funcTable（创建一个 Table 里的函数）
- require：
  requireService（引用一个 Service 文件）、requireTable
- trans：
  补全事务语法
- template：
  templateTable（补全 table 类的模板）

## 常见问题

- 运行失败？
  1. 根目录下是否有.env 文件，没有找管理员要
  2. 端口被占用
- Unexpected token '.'
  1. 可能是运行环境问题，比如重装 nodejs 环境，或者有安装 nvm 的话，可以切换 nodejs 版本
