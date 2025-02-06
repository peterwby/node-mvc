const test = require('japa')
const TemplateEngine = require('../core/template')

test.group('Template Engine', () => {
  test('should handle conditional rendering correctly', async (assert) => {
    const engine = new TemplateEngine()

    const template = `
      <div>
        <% if has_create_permission %>
          <a href="create">Create New</a>
        <% endif %>
        <table>...</table>
      </div>
    `

    // 测试 has_create_permission 为 true 的情况
    const resultTrue = await engine.render(template, {
      has_create_permission: true,
    })
    assert.include(resultTrue, '<a href="create">Create New</a>')

    // 测试 has_create_permission 为 false 的情况
    const resultFalse = await engine.render(template, {
      has_create_permission: false,
    })
    assert.notInclude(resultFalse, '<a href="create">Create New</a>')
  })

  test('should handle else conditions correctly', async (assert) => {
    const engine = new TemplateEngine()

    const template = `
      <div>
        <% if has_permission %>
          <span>Has Permission</span>
        <% else %>
          <span>No Permission</span>
        <% endif %>
      </div>
    `

    const resultTrue = await engine.render(template, {
      has_permission: true,
    })
    assert.include(resultTrue, '<span>Has Permission</span>')
    assert.notInclude(resultTrue, '<span>No Permission</span>')

    const resultFalse = await engine.render(template, {
      has_permission: false,
    })
    assert.include(resultFalse, '<span>No Permission</span>')
    assert.notInclude(resultFalse, '<span>Has Permission</span>')
  })

  test('should handle nested conditions correctly', async (assert) => {
    const engine = new TemplateEngine()

    const template = `
      <div>
        <% if outer %>
          Outer
          <% if inner %>
            Inner
          <% endif %>
        <% endif %>
      </div>
    `

    const result1 = await engine.render(template, {
      outer: true,
      inner: true,
    })
    assert.include(result1, 'Outer')
    assert.include(result1, 'Inner')

    const result2 = await engine.render(template, {
      outer: true,
      inner: false,
    })
    assert.include(result2, 'Outer')
    assert.notInclude(result2, 'Inner')

    const result3 = await engine.render(template, {
      outer: false,
      inner: true,
    })
    assert.notInclude(result3, 'Outer')
    assert.notInclude(result3, 'Inner')
  })

  test('should handle variables correctly', async (assert) => {
    const engine = new TemplateEngine()

    const template = `Hello, \${name}!`
    const result = await engine.render(template, {
      name: 'World',
    })
    assert.equal(result, 'Hello, World!')
  })

  test('should handle complex expressions in conditions', async (assert) => {
    const engine = new TemplateEngine()

    const template = `
      <% if count > 0 && has_permission %>
        Show Content
      <% endif %>
    `

    const result1 = await engine.render(template, {
      count: 1,
      has_permission: true,
    })
    assert.include(result1, 'Show Content')

    const result2 = await engine.render(template, {
      count: 0,
      has_permission: true,
    })
    assert.notInclude(result2, 'Show Content')

    const result3 = await engine.render(template, {
      count: 1,
      has_permission: false,
    })
    assert.notInclude(result3, 'Show Content')
  })
})
