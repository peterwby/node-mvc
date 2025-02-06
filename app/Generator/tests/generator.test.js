const test = require('japa')
const path = require('path')
const fs = require('fs')
const CodeGenerator = require('../core/generator')
const TemplateEngine = require('../core/template')
const { ERROR_CODES } = require('../core/errors')

test.group('Generator', (group) => {
  let generator

  group.before(async () => {
    generator = new CodeGenerator()
    // 禁用TODO注释以便测试
    generator.templateEngine = new TemplateEngine({ addTodoComments: false })
    await generator.init()
  })

  test('should initialize generator correctly', async (assert) => {
    assert.isTrue(fs.existsSync(generator.options.tempDir))
  })

  test('should render template correctly', async (assert) => {
    const template = `
      @if(show_title)
        <h1>{{ title }}</h1>
      @endif
      @each(item in items)
        <div>{{ item.name }}</div>
      @endeach
    `
    const data = {
      show_title: true,
      title: 'Test Title',
      items: [{ name: 'Item 1' }, { name: 'Item 2' }],
    }

    const result = generator.templateEngine.render(template, data)
    assert.include(result, '<h1>Test Title</h1>')
    assert.include(result, '<div>Item 1</div>')
    assert.include(result, '<div>Item 2</div>')
  })

  test('should generate code correctly', async (assert) => {
    const params = {
      moduleName: 'test',
      sqlInfo: {
        table: 'users',
        fields: [
          { name: 'id', type: 'int' },
          { name: 'name', type: 'varchar' },
          { name: 'email', type: 'varchar' },
        ],
      },
      targetDir: path.join(generator.options.tempDir, 'test_target'),
    }

    const result = await generator.generate(params)
    assert.isTrue(fs.existsSync(result.workDir))
    assert.isArray(result.files)
  })

  test('should handle template errors gracefully', async (assert) => {
    try {
      generator.templateEngine.render('@if(invalid_condition)@endif', {})
      assert.fail('渲染模板失败')
    } catch (error) {
      assert.equal(error.code, ERROR_CODES.TEMPLATE_ERROR)
      assert.include(error.message, '渲染模板失败')
    }
  })

  test('should validate template variables', async (assert) => {
    // 测试空字段数组
    try {
      await generator.generate({
        moduleName: 'test',
        sqlInfo: {
          table: 'users',
          fields: [],
        },
      })
      assert.fail('应该抛出字段验证错误')
    } catch (error) {
      assert.equal(error.code, ERROR_CODES.GENERATOR_ERROR)
      assert.include(error.message, '缺少必需的参数: targetDir')
    }

    // 测试缺少必需变量
    try {
      await generator.generate({
        moduleName: 'test',
        sqlInfo: {},
      })
      assert.fail('应该抛出缺少必需变量错误')
    } catch (error) {
      assert.equal(error.code, ERROR_CODES.GENERATOR_ERROR)
      assert.include(error.message, '缺少必需的参数: targetDir')
    }
  })

  test('should handle undefined template variables', async (assert) => {
    const template = '{{undefined_var}}'
    const result = generator.templateEngine.render(template, {})
    assert.equal(result, '')
  })

  test('should convert non-string values to string', async (assert) => {
    const template = '{{number}}{{boolean}}{{object}}'
    const data = {
      number: 123,
      boolean: true,
      object: { toString: () => 'object' },
    }
    const result = generator.templateEngine.render(template, data)
    assert.equal(result, '123trueobject')
  })

  group.after(async () => {
    // 清理测试生成的文件
    if (fs.existsSync(generator.options.tempDir)) {
      fs.rmSync(generator.options.tempDir, { recursive: true, force: true })
    }
  })
})
