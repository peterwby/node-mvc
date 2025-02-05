const { test } = require('@japa/runner')
const { ERROR_CODES, GeneratorError } = require('../core/errors')
const Logger = require('../utils/logger')

// 使用独立的测试环境，避免依赖框架
process.env.NODE_ENV = 'testing'

test.group('Logger', () => {
  test('should handle GeneratorError correctly', async ({ assert }) => {
    const logger = new Logger({ module: 'TestModule' })
    const error = new GeneratorError(ERROR_CODES.EMPTY_SQL, 'SQL语句不能为空', 'test_error_123')
    logger.error(error)
    const logData = logger.getLastError()

    assert.equal(logData.code, ERROR_CODES.EMPTY_SQL)
    assert.equal(logData.message, 'SQL语句不能为空')
    assert.equal(logData.track, 'test_error_123')
    assert.exists(logData.stack)
  })

  test('should handle standard Error correctly', async ({ assert }) => {
    const logger = new Logger({ module: 'TestModule' })
    const error = new Error('测试错误')
    logger.error(error, ERROR_CODES.UNKNOWN)
    const logData = logger.getLastError()

    assert.equal(logData.code, ERROR_CODES.UNKNOWN)
    assert.equal(logData.message, '测试错误')
    assert.exists(logData.track)
    assert.exists(logData.stack)
    assert.include(logData.track, 'testmodule_error_')
  })

  test('should handle string error message correctly', async ({ assert }) => {
    const logger = new Logger({ module: 'TestModule' })
    logger.error('测试错误消息', ERROR_CODES.INVALID_SQL)
    const logData = logger.getLastError()

    assert.equal(logData.code, ERROR_CODES.INVALID_SQL)
    assert.equal(logData.message, '测试错误消息')
    assert.exists(logData.track)
    assert.include(logData.track, 'testmodule_error_')
  })

  test('should handle circular references in data', async ({ assert }) => {
    const logger = new Logger({ module: 'TestModule' })
    const circularObj = { a: 1 }
    circularObj.self = circularObj
    logger.error('测试循环引用', ERROR_CODES.UNKNOWN, { data: circularObj })
    const logData = logger.getLastError()

    assert.equal(logData.code, ERROR_CODES.UNKNOWN)
    assert.equal(logData.message, '测试循环引用')
    assert.exists(logData.data.error)
    assert.include(logData.data.error, '循环引用')
  })

  test('should support chain calls', async ({ assert }) => {
    const logger = new Logger({ module: 'TestModule' })
    const result = logger.info('信息1').debug('调试1').error('错误1', ERROR_CODES.UNKNOWN).info('信息2')

    assert.instanceOf(result, Logger)
  })

  test('should handle debug level logs', async ({ assert }) => {
    const logger = new Logger({ module: 'Test' })
    const result = logger.debug('Debug message', { test: true })
    assert.instanceOf(result, Logger)
  })

  test('should handle warn level logs', async ({ assert }) => {
    const logger = new Logger({ module: 'Test' })
    const result = logger.warn('Warning message', { test: true })
    assert.instanceOf(result, Logger)
  })

  test('should handle circular references in log data', async ({ assert }) => {
    const logger = new Logger({ module: 'Test' })
    const circularObj = { a: 1 }
    circularObj.self = circularObj
    logger.info('Circular reference test', circularObj)
    assert.isTrue(true) // 如果没有抛出错误就通过
  })

  test('should handle complex error objects', async ({ assert }) => {
    const logger = new Logger({ module: 'Test' })
    const error = new Error('Test error')
    error.code = 'TEST-001'
    error.track = 'test_track_123'
    error.extra = { test: true }
    logger.error(error)
    const lastError = logger.getLastError()
    assert.equal(lastError.message, 'Test error')
    assert.equal(lastError.code, 'TEST-001')
    assert.equal(lastError.track, 'test_track_123')
    assert.isTrue(lastError.stack.includes('Error: Test error'))
  })

  test('should handle non-error objects in error method', async ({ assert }) => {
    const logger = new Logger({ module: 'Test' })
    const nonError = { message: 'Not an error', code: 'TEST-002' }
    logger.error(nonError)
    const lastError = logger.getLastError()
    assert.equal(lastError.message, 'Not an error')
    assert.equal(lastError.code, 'TEST-002')
  })
})
