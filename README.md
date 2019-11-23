# Node.js 的 MVC 框架

## 简介

- 本项目的 git 地址：https://gitee.com/sh-chanson/node-server.git
- 基于 Adonis.js 框架，可以包办 web 后端的几乎所有功能
- 由于整体项目一般采用前后端分离设计，View 交给前端处理，所以 MVC 架构有所变形：Router->Controllers->Services->Models
- 开发环境下，支持热更新，即修改完文件保存后立即生效

## 须具备知识

- node.js（最好用过类似 express、koa、egg 等框架）
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
  sudo npm i -g live-server nodemon @adonisjs/cli

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

## 如何使用

- 可以开始测试了，默认准备了由浅入深的 3 个例子
- 打开浏览器，分别输入：

  - http://127.0.0.1:3201/test1
  - http://127.0.0.1:3201/test2?uname=peter
  - http://127.0.0.1:3201/test3?fromDate=2019-03-22&toDate=2019-04-25&status=1&page=1&limit=3

- 打开/start/routes.js ，一步一步跟踪下去，看每一步怎么实现。完整顺序是 Router->Controllers->Services->Models

## 常用操作

- session 的操作
  ```
  ctx.session.get('user')
  ctx.session.put('user', 'wu')
  ```
- Util.end()：
  函数正常结束时调用。用途：规范函数的返回值，使得返回值具有相同结构
- Util.error()：
  函数内部抛出异常时，在 catch 里调用本函数，使得返回值具有相同结构
- Util.end2front()：
  Controller 里的函数正常结束时调用。规定要返回给前端的信息
- Util.error2front()：
  Controller 里的函数内部抛出异常时，在 catch 里调用本函数，规定要返回给前端的信息
- 打印信息到控制台
  ```
  log.debug('调试时建议用这个')
  log.info('普通信息')
  log.notice('引起注意')
  log.error('错误信息')
  ```
- Util.toCamel(obj)：
  把变量名从下划线转为驼峰式
- Util.toLine(obj)：
  把变量名从驼峰式转为下划线

## 常见问题

- 运行失败？
  - 根目录下是否有.env 文件
  - 端口被占用
