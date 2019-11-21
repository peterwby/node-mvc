# Node.js 的 MVC 框架

基于 Adonis.js 框架

本项目的 git 地址：
https://gitee.com/sh-chanson/common-system-server.git

## 准备工作

- 安装 node.js（选择 LTS 版本）https://nodejs.org/en/
- 安装 git

###### 在命令行输入以下命令

- 源管理器
  npm i -g nrm
- 切换国内源
  nrm use taobao
- 其他全局包
  npm i -g live-server nodemon pm2
  npm i -g @adonisjs/cli
  pm2 install pm2-logrotate

## 安装

###### 项目根目录，命令行输入：

```bash
npm i
```

## 首次运行时

```bash
npm run new
```

## 运行（开发环境）

```bash
npm run dev
```

## 常见问题

- 运行失败
  - 根目录下是否有.env 文件？
  - 端口被占用？
