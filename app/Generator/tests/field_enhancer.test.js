const test = require('japa')
const { assert } = require('@japa/assert')
const FieldEnhancer = require('../core/field_enhancer')
const { ERROR_CODES } = require('../core/errors')

test.group('Generator/FieldEnhancer', (group) => {
  let enhancer

  group.beforeEach(() => {
    enhancer = new FieldEnhancer()
  })

  test('should infer HTML input types correctly', async (assert) => {
    const testCases = [
      {
        field: { name: 'user_email', type: 'string', original: 'user_email' },
        expected: 'email',
      },
      {
        field: { name: 'phone_number', type: 'string', original: 'phone_number' },
        expected: 'tel',
      },
      {
        field: { name: 'user_password', type: 'string', original: 'user_password' },
        expected: 'password',
      },
      {
        field: { name: 'age', type: 'number', original: 'age' },
        expected: 'number',
      },
      {
        field: { name: 'created_at', type: 'datetime', original: 'created_at' },
        expected: 'date',
      },
      {
        field: { name: 'is_active', type: 'boolean', original: 'is_active' },
        expected: 'checkbox',
      },
    ]

    for (const { field, expected } of testCases) {
      const enhanced = enhancer.enhance(field)
      assert.equal(enhanced.html_type, expected)
    }
  })

  test('should infer form control types correctly', async (assert) => {
    const testCases = [
      {
        field: { name: 'user_password', type: 'string', original: 'user_password' },
        tableField: { Type: 'varchar(255)' },
        expected: 'password',
      },
      {
        field: { name: 'status', type: 'string', original: 'status' },
        tableField: { Type: 'varchar(50)' },
        expected: 'select',
      },
      {
        field: { name: 'category_id', type: 'number', original: 'category_id' },
        tableField: { Type: 'int(11)' },
        expected: 'select',
      },
      {
        field: { name: 'description', type: 'string', original: 'description' },
        tableField: { Type: 'text' },
        expected: 'rich_editor',
      },
      {
        field: { name: 'content', type: 'string', original: 'content' },
        tableField: { Type: 'longtext' },
        expected: 'rich_editor',
      },
      {
        field: { name: 'address', type: 'string', original: 'address' },
        tableField: { Type: 'varchar(1000)' },
        expected: 'textarea',
      },
    ]

    for (const { field, tableField, expected } of testCases) {
      const enhanced = enhancer.enhance(field, tableField)
      assert.equal(enhanced.form_type, expected)
    }
  })

  test('should handle required fields correctly', async (assert) => {
    const testCases = [
      {
        field: { name: 'username', type: 'string', original: 'username' },
        tableField: { Null: 'NO' },
        expected: true,
      },
      {
        field: { name: 'bio', type: 'string', original: 'bio' },
        tableField: { Null: 'YES' },
        expected: false,
      },
      {
        field: { name: 'avatar', type: 'string', original: 'avatar' },
        tableField: null,
        expected: false,
      },
    ]

    for (const { field, tableField, expected } of testCases) {
      const enhanced = enhancer.enhance(field, tableField)
      assert.equal(enhanced.required, expected)
    }
  })

  test('should determine searchable fields correctly', async (assert) => {
    const testCases = [
      {
        field: { name: 'username', type: 'string', original: 'username' },
        expected: true,
      },
      {
        field: { name: 'password', type: 'string', original: 'password' },
        expected: false,
      },
      {
        field: { name: 'created_at', type: 'datetime', original: 'created_at' },
        expected: false,
      },
      {
        field: { name: 'content', type: 'string', original: 'content', form_type: 'rich_editor' },
        expected: false,
      },
    ]

    for (const { field, expected } of testCases) {
      const enhanced = enhancer.enhance(field)
      console.log('测试字段:', {
        name: field.name,
        type: field.type,
        form_type: enhanced.form_type,
        html_type: enhanced.html_type,
        searchable: enhanced.searchable,
        expected,
      })
      assert.equal(enhanced.searchable, expected)
    }
  })

  test('should determine editable fields correctly', async (assert) => {
    const testCases = [
      {
        field: { name: 'username', type: 'string', original: 'username' },
        expected: true,
      },
      {
        field: { name: 'id', type: 'number', original: 'id' },
        expected: false,
      },
      {
        field: { name: 'created_at', type: 'datetime', original: 'created_at' },
        expected: false,
      },
    ]

    for (const { field, expected } of testCases) {
      const enhanced = enhancer.enhance(field)
      assert.equal(enhanced.editable, expected)
    }
  })

  test('should determine listable fields correctly', async (assert) => {
    const testCases = [
      {
        field: { name: 'username', type: 'string', original: 'username' },
        expected: true,
      },
      {
        field: { name: 'password', type: 'string', original: 'password' },
        expected: false,
      },
      {
        field: { name: 'deleted_at', type: 'datetime', original: 'deleted_at' },
        expected: false,
      },
    ]

    for (const { field, expected } of testCases) {
      const enhanced = enhancer.enhance(field)
      assert.equal(enhanced.listable, expected)
    }
  })

  test('should add validation rules correctly', async (assert) => {
    const testCases = [
      {
        field: { name: 'email', type: 'string', original: 'email' },
        tableField: { Null: 'NO' },
        expected: {
          notEmpty: { message: 'please enter in the correct format' },
          emailAddress: { message: 'please enter in the correct format' },
        },
      },
      {
        field: { name: 'password', type: 'string', original: 'password' },
        tableField: { Null: 'NO' },
        expected: {
          notEmpty: { message: 'please enter in the correct format' },
          stringLength: { min: 6, max: 16, message: 'please enter in the correct format' },
        },
      },
      {
        field: { name: 'phone', type: 'string', original: 'phone' },
        tableField: { Null: 'NO' },
        expected: {
          notEmpty: { message: 'please enter in the correct format' },
          phone: { message: 'please enter in the correct format' },
        },
      },
    ]

    for (const { field, tableField, expected } of testCases) {
      const enhanced = enhancer.enhance(field, tableField)
      assert.deepEqual(enhanced.validation, expected)
    }
  })

  test('should handle errors gracefully', async (assert) => {
    const invalidField = null
    try {
      enhancer.enhance(invalidField)
      assert.fail('Should throw error')
    } catch (err) {
      assert.equal(err.code, ERROR_CODES.FIELD_ENHANCE_ERROR)
      assert.equal(err.message, '字段信息不能为空')
    }
  })
})
