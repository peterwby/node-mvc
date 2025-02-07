'use strict'

const path = require('path')
const moduleAlias = require('module-alias')

// 添加模块别名
moduleAlias.addAliases({
  '@Generator': path.join(__dirname, '..'),
})

// 模拟 Adonis.js 的 use 函数
global.use = (name) => {
  if (name === 'Database') {
    return {
      raw: async () => [[]],
    }
  }
  throw new Error(`Unknown module: ${name}`)
}

const { configure, run } = require('@japa/runner')
const { assert } = require('@japa/assert')

configure({
  files: [path.join(__dirname, 'parser.test.js')],
  plugins: [assert()],
  timeout: 10000,
  bail: true,
})

run()
