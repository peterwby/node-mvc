#!/usr/bin/env node

// 设置路径别名
const moduleAlias = require('module-alias')
const path = require('path')

// 获取项目根目录的绝对路径
const rootPath = path.resolve(__dirname, '../../..')

// 注册路径别名
moduleAlias.addAliases({
  '@root': rootPath,
  '@Lib': path.join(rootPath, 'app/Lib'),
  '@Table': path.join(rootPath, 'app/Table'),
  '@Model': path.join(rootPath, 'app/Model'),
  '@Service': path.join(rootPath, 'app/Service'),
  '@Controller': path.join(rootPath, 'app/Controller'),
  '@Validator': path.join(rootPath, 'app/Validator'),
  '@Middleware': path.join(rootPath, 'app/Middleware'),
  '@Exception': path.join(rootPath, 'app/Exception'),
  '@Generator': path.join(rootPath, 'app/Generator'),
})

const { configure, run } = require('@japa/runner')
const { assert } = require('@japa/assert')

configure({
  files: [path.join(__dirname, '*.test.js')],
  plugins: [assert()],
})

run()
