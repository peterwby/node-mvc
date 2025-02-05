const test = require('japa')
const path = require('path')
const fs = require('fs')
const CodeGenerator = require('../core/generator')
const TemplateEngine = require('../core/template')
const { ERROR_CODES } = require('../core/errors')

test.group('Frontend Generator', (group) => {
  let generator

  group.before(async () => {
    generator = new CodeGenerator()
    generator.templateEngine = new TemplateEngine({ addTodoComments: false })
    await generator.init()
  })

  test('should generate list page with all field types', async (assert) => {
    // 1. 准备测试数据 - 包含所有可能的字段类型
    const params = {
      moduleName: 'test',
      sqlInfo: {
        table: 'users',
        fields: [
          {
            name: 'id',
            type: 'int',
            nullable: false,
            primary: true,
            comment: 'ID',
          },
          {
            name: 'avatar',
            type: 'varchar',
            nullable: true,
            comment: '头像',
            listable: true,
            type: 'image',
          },
          {
            name: 'status',
            type: 'tinyint',
            nullable: false,
            comment: '状态',
            listable: true,
            type: 'status',
          },
          {
            name: 'created_at',
            type: 'datetime',
            nullable: false,
            comment: '创建时间',
            listable: true,
            type: 'datetime',
          },
          {
            name: 'description',
            type: 'text',
            nullable: true,
            comment: '描述',
            listable: true,
          },
        ],
      },
      targetDir: path.join(generator.options.tempDir, 'test_frontend'),
      has_create_permission: true,
      has_edit_permission: true,
      has_delete_permission: true,
      has_batch_delete_permission: true,
    }

    // 2. 生成代码
    const result = await generator.generate(params)
    const listPagePath = path.join(result.workDir, 'frontend/list.edge')
    const content = await fs.promises.readFile(listPagePath, 'utf8')
    console.log('Generated content:', content)

    // 复制生成的文件到固定位置
    const targetPath = path.join(process.cwd(), 'resources/views/admin/news/list.edge')
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.copyFileSync(listPagePath, targetPath)

    // 3. 验证生成的文件
    assert.isTrue(fs.existsSync(listPagePath))

    // 4. 验证不同类型字段的渲染
    // 4.1 图片类型
    assert.include(content, '<div class="symbol symbol-35px">')
    assert.include(content, '<img ')
    assert.include(content, '</div>')

    // 4.2 状态类型
    assert.include(content, "const statusClass = item === trans('enable') ? 'text-success' : 'text-danger'")
    assert.include(content, '<div class="\' + statusClass + \' font-medium">')

    // 4.3 日期时间类型
    assert.include(content, "item ? Util.formatDate(item) : trans('no data')")

    // 4.4 普通文本类型
    assert.include(content, "<div>' + (item || trans('no data')) + '</div>")
  })

  test('should handle empty fields gracefully', async (assert) => {
    const params = {
      moduleName: 'test',
      sqlInfo: {
        table: 'users',
        fields: [],
      },
      targetDir: path.join(generator.options.tempDir, 'test_frontend'),
    }

    try {
      await generator.generate(params)
      assert.fail('Should throw error for empty fields')
    } catch (error) {
      assert.equal(error.code, ERROR_CODES.GENERATOR_ERROR)
      assert.include(error.message, '缺少必需的模板变量: sqlInfo.fields')
    }
  })

  test('should handle missing permissions gracefully', async (assert) => {
    const params = {
      moduleName: 'test',
      sqlInfo: {
        table: 'users',
        fields: [
          {
            name: 'id',
            type: 'int',
            nullable: false,
            primary: true,
            comment: 'ID',
            listable: true,
          },
        ],
      },
      targetDir: path.join(generator.options.tempDir, 'test_frontend'),
      has_create_permission: false,
      has_edit_permission: false,
      has_delete_permission: false,
      has_batch_delete_permission: false,
    }

    const result = await generator.generate(params)
    const listPagePath = path.join(result.workDir, 'frontend/list.edge')
    const content = await fs.promises.readFile(listPagePath, 'utf8')

    // 验证权限相关的按钮不会显示
    assert.notInclude(content, '<a href="/admin/test/create"')
    assert.notInclude(content, 'batch_delete_btn')
  })

  test('should handle select filter type correctly', async (assert) => {
    const params = {
      moduleName: 'test',
      sqlInfo: {
        table: 'users',
        fields: [
          {
            name: 'status',
            type: 'tinyint',
            nullable: false,
            comment: '状态',
            filterable: true,
            filter_type: 'select',
          },
        ],
      },
      options: {
        status: [
          { value: 1, label: 'trans("enable")' },
          { value: 0, label: 'trans("disable")' },
        ],
      },
      targetDir: path.join(generator.options.tempDir, 'test_frontend'),
    }

    const result = await generator.generate(params)
    const listPagePath = path.join(result.workDir, 'frontend/list.edge')
    const content = await fs.promises.readFile(listPagePath, 'utf8')

    // 验证select下拉框的渲染
    assert.include(content, '<select class="select select-sm w-28"')
    assert.include(content, 'value="1"')
    assert.include(content, 'value="0"')
  })

  test('should handle custom render function correctly', async (assert) => {
    const params = {
      moduleName: 'test',
      sqlInfo: {
        table: 'users',
        fields: [
          {
            name: 'custom',
            type: 'varchar',
            nullable: true,
            comment: '自定义',
            listable: true,
            render: "(item) => { return '<div class=\"custom\">' + item + '</div>' }",
          },
        ],
      },
      targetDir: path.join(generator.options.tempDir, 'test_frontend'),
    }

    const result = await generator.generate(params)
    const listPagePath = path.join(result.workDir, 'frontend/list.edge')
    const content = await fs.promises.readFile(listPagePath, 'utf8')

    // 验证自定义渲染函数
    assert.include(content, 'render: {{{ field.render }}},')
  })

  test('should generate news module correctly', async (assert) => {
    const params = {
      moduleName: 'news',
      sqlInfo: {
        table: 'news',
        fields: [
          {
            name: 'id',
            type: 'int',
            nullable: false,
            primary: true,
            comment: 'ID',
            listable: true,
            filterable: true,
            min_width: '200px',
            sort_direction: 'asc',
            filter_type: 'text',
          },
          {
            name: 'title',
            type: 'varchar',
            nullable: false,
            comment: '标题',
            listable: true,
            filterable: true,
            min_width: '200px',
            sort_direction: 'asc',
            filter_type: 'text',
          },
          {
            name: 'type',
            type: 'varchar',
            nullable: false,
            comment: '类型',
            listable: true,
            filterable: true,
            min_width: '200px',
            sort_direction: 'asc',
            filter_type: 'select',
            options: [
              { value: 'notice', label: 'trans("notice")' },
              { value: 'news', label: 'trans("news")' },
            ],
          },
          {
            name: 'status',
            type: 'tinyint',
            nullable: false,
            comment: '状态',
            listable: true,
            filterable: true,
            min_width: '200px',
            sort_direction: 'asc',
            filter_type: 'select',
          },
        ],
      },
      options: {
        status: [
          { value: 1, label: 'trans("enable")' },
          { value: 0, label: 'trans("disable")' },
        ],
      },
      targetDir: path.join(generator.options.tempDir, 'test_news'),
    }

    const result = await generator.generate(params)
    const listPagePath = path.join(result.workDir, 'frontend/list.edge')
    const content = await fs.promises.readFile(listPagePath, 'utf8')

    // 验证生成的文件
    assert.isTrue(fs.existsSync(listPagePath))
  })

  group.after(async () => {
    // 清理测试生成的文件
    if (fs.existsSync(generator.options.tempDir)) {
      fs.rmSync(generator.options.tempDir, { recursive: true, force: true })
    }
  })
})
