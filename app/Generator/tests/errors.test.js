'use strict'

const { test } = require('@japa/runner')
const { ERROR_CODES, ERROR_MESSAGES, GeneratorError } = require('@Generator/core/errors')

test.group('Generator/Errors', () => {
  test('should have matching error messages for all error codes', async ({ assert }) => {
    // 检查每个错误码是否都有对应的错误消息
    Object.values(ERROR_CODES).forEach((code) => {
      assert.exists(ERROR_MESSAGES[code], `Missing error message for code: ${code}`)
    })

    // 检查每个错误消息是否都有对应的错误码
    Object.keys(ERROR_MESSAGES).forEach((code) => {
      assert.exists(
        Object.values(ERROR_CODES).find((c) => c === code),
        `Error message exists for non-existent code: ${code}`
      )
    })
  })

  test('should create GeneratorError with code and message', async ({ assert }) => {
    const error = new GeneratorError(ERROR_CODES.EMPTY_SQL, ERROR_MESSAGES[ERROR_CODES.EMPTY_SQL])
    assert.equal(error.name, 'GeneratorError')
    assert.equal(error.code, ERROR_CODES.EMPTY_SQL)
    assert.equal(error.message, ERROR_MESSAGES[ERROR_CODES.EMPTY_SQL])
    assert.isNull(error.track)
  })

  test('should create GeneratorError with track', async ({ assert }) => {
    const track = 'test_error_123'
    const error = new GeneratorError(ERROR_CODES.EMPTY_SQL, ERROR_MESSAGES[ERROR_CODES.EMPTY_SQL], track)
    assert.equal(error.track, track)
  })

  test('should create GeneratorError with custom message', async ({ assert }) => {
    const customMessage = '自定义错误消息'
    const error = new GeneratorError(ERROR_CODES.EMPTY_SQL, customMessage)
    assert.equal(error.message, customMessage)
  })

  test('should convert GeneratorError to log data', async ({ assert }) => {
    const track = 'test_error_123'
    const error = new GeneratorError(ERROR_CODES.EMPTY_SQL, ERROR_MESSAGES[ERROR_CODES.EMPTY_SQL], track)
    const logData = error.toLogData()

    assert.deepEqual(logData, {
      name: 'GeneratorError',
      code: ERROR_CODES.EMPTY_SQL,
      message: ERROR_MESSAGES[ERROR_CODES.EMPTY_SQL],
      track,
      stack: error.stack,
    })
  })

  test('should verify error code format', async ({ assert }) => {
    // 检查所有错误码是否符合 GEN-XXX-YYY 格式
    const codePattern = /^GEN-(SQL|TPL|PATH|FILE|SYS)-\d{3}$/
    Object.values(ERROR_CODES).forEach((code) => {
      assert.isTrue(codePattern.test(code), `Invalid error code format: ${code}`)
    })
  })

  test('should group error codes by type', async ({ assert }) => {
    // SQL 错误码应该以 GEN-SQL 开头
    Object.entries(ERROR_CODES)
      .filter(([key]) => key.startsWith('SQL'))
      .forEach(([, code]) => {
        assert.isTrue(code.startsWith('GEN-SQL-'), `SQL error code should start with GEN-SQL-: ${code}`)
      })

    // TPL 错误码应该以 GEN-TPL 开头
    Object.entries(ERROR_CODES)
      .filter(([key]) => key.startsWith('TPL'))
      .forEach(([, code]) => {
        assert.isTrue(code.startsWith('GEN-TPL-'), `Template error code should start with GEN-TPL-: ${code}`)
      })

    // PATH 错误码应该以 GEN-PATH 开头
    Object.entries(ERROR_CODES)
      .filter(([key]) => key.startsWith('PATH'))
      .forEach(([, code]) => {
        assert.isTrue(code.startsWith('GEN-PATH-'), `Path error code should start with GEN-PATH-: ${code}`)
      })

    // FILE 错误码应该以 GEN-FILE 开头
    Object.entries(ERROR_CODES)
      .filter(([key]) => key.startsWith('FILE'))
      .forEach(([, code]) => {
        assert.isTrue(code.startsWith('GEN-FILE-'), `File error code should start with GEN-FILE-: ${code}`)
      })

    // SYS 错误码应该以 GEN-SYS 开头
    Object.entries(ERROR_CODES)
      .filter(([key]) => key.startsWith('SYS'))
      .forEach(([, code]) => {
        assert.isTrue(code.startsWith('GEN-SYS-'), `System error code should start with GEN-SYS-: ${code}`)
      })
  })
})
