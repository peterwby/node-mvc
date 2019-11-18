'use strict'

//==========废 弃=========================
//自动引用所有表文件
//const Tables = require('require-all')(__dirname + '/Table')
//function tables(tableName) {
//  return new Tables[tableName](tableName)
//}
//调用：Tables('tableName').create({})
//==========废 弃=========================

//每个表都手工记录在这里（用自动引用的方式更省事，但那样的话vscode不能智能提示，似乎更麻烦）
const Test = require('./Table/test') //test表
const test = new Test('test')

const Tables = {
  test,
  //其他表...
}

module.exports = Tables
