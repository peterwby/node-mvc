'use strict'

//==========废 弃=========================
//const Tables = require('require-all')(__dirname + '/Table')
//function tables(tableName) {
//  return new Tables[tableName](tableName)
//}
//调用：Tables('tableName').create({})
//==========废 弃=========================

//每个表都记录在这里
const Test = require('./Table/test')
const test = new Test('test')

const Tables = {
  test,
}

module.exports = Tables
