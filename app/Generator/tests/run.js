'use strict'

const path = require('path')
const moduleAlias = require('module-alias')
const { configure, run } = require('@japa/runner')
const { assert } = require('@japa/assert')

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

configure({
  files: process.argv[2] === 'tmp' ? [path.join(__dirname, 'tmp.test.js')] : [path.join(__dirname, '**/parser.test.js')],
  plugins: [assert()],
  timeout: 0,
  bail: true,
})

run()
