# Node.js 的 后端 MVC 框架

## 简介

- 本项目的 git 地址：https://gitee.com/sh-chanson/node-server.git
- 基于 Adonis.js 框架，其官方文档地址：https://adonisjs.com/docs/4.1/folder-structure
- 整体项目一般采用前后端分离设计，View 交给前端处理， MVC 架构有所变形：Router->Controllers->Services->Models
- models 层目前不使用 orm，而是 query builder，基于 knex，容易上手

## 须具备知识

- node.js（最好用过类似 express、koa、egg.js 等框架）
- 熟悉 MVC 知识
- 熟悉 es6 语法
- 熟悉 sql 语法

## 准备工作

- 安装 node.js（选择 LTS 版本）https://nodejs.org/en/

###### 在命令行输入以下命令

（windows 下无需 sudo 这 4 个字母）

- 源管理器
  sudo npm i -g nrm
- 切换国内源
  sudo nrm use taobao
- 其他全局包
  sudo npm i -g live-server @adonisjs/cli

## 项目安装

###### git clone 项目后，在根目录下：

1. 安装项目的依赖

```
sudo npm i
```

2. 首次运行项目时

```
npm run new
```

3. 记得把.env 文件复制到项目根目录下

- 找管理员要.env 配置文件

4. 启动项目（开发环境）

```
npm run dev
```

## 项目结构说明

- /start/routes.js：此文件用来处理路由，并绑定相应的 Controller
- /app/Controllers/Http/PC/xxx.js：所有 Controller 文件都放在这里
- /app/Services/xxx.js：所有 Services 文件都放在这里，且都继承于 BaseService 基类
- /app/Models/Table/xxx.js：所有的表文件都放在这里，文件名应跟数据库上真实表文件名相同，且都继承于 BaseTable 基类
- /config/xxx.js：可以对不同模块分别进行配置（一般按默认配置即可）
- /.env：项目根目录下应该有此文件，用来设置全局配置信息。（重要）
- /app/Lib/Util.js：常用工具库，包含对数组、对象、字符串、时间等处理的函数
- /app/Lib/Request.js：基于 axios.js 的 HTTP 库，用于 get、post 方式访问 url

## 如何使用

- 可以开始测试了，默认准备了 3 个由浅入深的例子
- 打开浏览器，分别输入：

  - http://127.0.0.1:3201/test1
  - http://127.0.0.1:3201/test2?uname=peter&status=1
  - http://127.0.0.1:3201/test3?fromDate=2019-03-22&toDate=2019-04-25&status=1&page=1&limit=3

- 打开/start/routes.js ，一步一步跟踪下去，看每一步怎么实现。完整顺序是 Router->Controllers->Services->Models

## 常用操作

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

- 每个函数正常结束时调用。用途：规范函数的返回值，使得返回值具有相同结构

  ```
  Util.end({})
  ```

- 每个函数内部抛出异常时，在 catch 里调用本函数，使得返回值具有相同结构
  ```
  Util.error({})
  ```
- Controller 里的函数正常结束时调用。规定要返回给前端的信息
  ```
  Util.end2front({})
  ```
- Controller 里的函数内部抛出异常时，在 catch 里调用本函数，规定要返回给前端的信息
  ```
  Util.error2front({})
  ```
- 打印信息到控制台

  ```
  log.debug('调试时建议用这个')
  log.info('普通信息')
  log.error('错误信息')
  ```

## 快捷操作

> 自定义了一些代码片段，比如输入 func，vscode 就会智能提示 funcController... 按下 tab 键，就会把 controller 下的函数结构补全

- func
  funcController（创建一个 Controller 里的函数）、funcService（创建一个 Service 里的函数）、funcTable（创建一个 Table 里的函数）
- require
  requireService（引用一个 Service 文件）、requireTable、requireJoin
- trans
  补全事务语法
- template
  templateTable（补全 table 类的模板）

## 常见问题

- 运行失败？
- 根目录下是否有.env 文件，没有找管理员要
- 端口被占用
