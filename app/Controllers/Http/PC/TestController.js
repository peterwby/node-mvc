'use strict'

const TestSrv = require(`../../../Services/TestService`)
const testSrv = new TestSrv()

class TestController {
  async test1(ctx) {
    const result = await testSrv.httpGet()
    return result
  }
}

module.exports = TestController
