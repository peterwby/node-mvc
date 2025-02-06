const fs = require('fs')
const { GeneratorError, ERROR_CODES, ERROR_MESSAGES } = require('./errors')
const Logger = require('../utils/logger')

class TemplateEngine {
  constructor(options = {}) {
    this.cache = new Map()
    // 全局函数列表，这些函数在模板中可以直接使用
    this.globalFunctions = new Set(['trans'])
    // 是否添加TODO注释（在测试模式下禁用）
    this.addTodoComments = options.addTodoComments !== false
    // 过滤器
    this.filters = {
      pascal: (str) => {
        // 将蛇形命名转换为帕斯卡命名（如：user_info -> UserInfo）
        const transformed = str
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join('')

        this.logger.debug('执行pascal过滤器:', {
          input: str,
          output: transformed,
          segments: str.split('_'), // 记录拆分后的单词段
        })
        return transformed
      },
      capitalize: (str) => {
        // 仅首字母大写（如：user -> User）
        const transformed = str.charAt(0).toUpperCase() + str.slice(1)
        this.logger.debug('执行capitalize过滤器:', {
          input: str,
          output: transformed,
          length: str.length, // 记录原始长度
        })
        return transformed
      },
    }
    // Edge语法标记列表
    this.edgeSyntaxPatterns = [
      '@layout',
      '@!section',
      '@section',
      '@endsection',
      '@each',
      '@endeach',
      '@if',
      '@else',
      '@elseif',
      '@endif',
      '@include',
      '@component',
      '@slot',
      '@!component',
    ]
    // 状态枚举
    this.STATE = {
      TEXT: 0, // 文本状态
      DIRECTIVE: 1, // 指令解析状态 <% ... %>
      VARIABLE: 2, // 变量替换状态 ${ ... }
    }
    this.logger = new Logger({ module: 'TemplateEngine' })

    // 初始化指令处理器
    this.directives = new Map([
      ['if', this._processIf.bind(this)],
      ['else', this._processElse.bind(this)],
      ['elseif', this._processElseif.bind(this)],
      ['endif', this._processEndif.bind(this)],
      ['each', this._processEach.bind(this)],
      ['endeach', this._processEndeach.bind(this)],
      ['json', this._processJson.bind(this)],
    ])
  }

  /**
   * 加载模板文件
   * @param {string} templatePath 模板文件路径
   * @returns {Promise<string>} 模板内容
   */
  async loadTemplate(templatePath) {
    this.logger.debug('开始加载模板文件', { templatePath })
    const startTime = process.hrtime()

    try {
      if (this.cache.has(templatePath)) {
        return this.cache.get(templatePath)
      }
      const content = await fs.promises.readFile(templatePath, 'utf8')
      const [seconds, nanoseconds] = process.hrtime(startTime)
      this.logger.info('模板文件加载完成', {
        templatePath,
        loadTime: seconds * 1000 + nanoseconds / 1000000,
        contentLength: content.length,
      })
      this.cache.set(templatePath, content)
      return content
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new GeneratorError(ERROR_CODES.TEMPLATE_NOT_FOUND, ERROR_MESSAGES[ERROR_CODES.TEMPLATE_NOT_FOUND], 'template_load_not_found')
      }
      throw new GeneratorError(ERROR_CODES.TEMPLATE_LOAD_ERROR, ERROR_MESSAGES[ERROR_CODES.TEMPLATE_LOAD_ERROR], 'template_load_error')
    }
  }

  /**
   * 渲染模板
   * @param {string} template 模板字符串
   * @param {object} data 数据对象
   * @returns {Promise<string>} 渲染后的字符串
   */
  async render(template, data) {
    try {
      this.logger.debug('开始渲染模板', { data })

      // 初始化上下文
      const ctx = {
        data,
        stack: [], // 用于跟踪if/each等指令的状态
        line: 1,
        column: 1,
        output: [], // 用于收集输出
        scope: [data], // 作用域栈，最后一个元素是当前作用域
      }

      const tokens = this._tokenize(template)

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]
        ctx.line = token.line
        ctx.column = token.column

        // 检查是否需要跳过当前token
        if (ctx.stack.length > 0) {
          const last = ctx.stack[ctx.stack.length - 1]

          if (last.type === 'if' && !last.value) {
            // 如果在if块内且条件为false，跳过直到遇到else、elseif或endif
            if (token.type !== 'directive') continue
            const directive = token.value.trim()
            if (!directive.match(/^(?:else|elseif|endif)/)) continue
          }

          if (last.type === 'each') {
            // 如果在each块内，收集内容直到遇到endeach
            if (token.type === 'directive' && token.value.trim() === 'endeach') {
              // 遇到endeach，处理收集的内容
              const content = last.content.join('')
              for (let j = 0; j < last.array.length; j++) {
                // 创建新的作用域
                const itemScope = {
                  ...ctx.scope[ctx.scope.length - 1], // 继承父作用域
                  [last.itemName]: last.array[j], // 添加当前项
                  index: j, // 添加索引
                }

                // 将新作用域推入栈
                ctx.scope.push(itemScope)

                // 渲染内容
                const rendered = await this.render(content, itemScope)
                ctx.output.push(rendered)

                // 恢复作用域
                ctx.scope.pop()
              }
              ctx.stack.pop()
              continue
            }

            // 收集each块内的内容
            if (!last.content) last.content = []
            if (token.type === 'text') {
              last.content.push(token.value)
            } else if (token.type === 'variable') {
              last.content.push('${' + token.value + '}')
            } else if (token.type === 'directive') {
              last.content.push('<%' + token.value + '%>')
            }
            continue
          }
        }

        switch (token.type) {
          case 'text':
            ctx.output.push(token.value)
            break

          case 'variable':
            const value = await this._getValue(token.value.trim(), ctx.scope[ctx.scope.length - 1])
            ctx.output.push(value !== undefined ? value : '')
            break

          case 'directive':
            await this._processDirective(ctx.output, token.value, ctx)
            break

          default:
            throw new Error(`Unknown token type: ${token.type}`)
        }
      }

      // 检查是否有未闭合的指令
      if (ctx.stack.length > 0) {
        const unclosed = ctx.stack.map((item) => item.type).join(', ')
        throw new Error(`Unclosed directives: ${unclosed}`)
      }

      return ctx.output.join('')
    } catch (error) {
      this.logger.error('渲染模板失败', {
        error: error.message,
        template: template.slice(0, 100) + '...',
      })
      throw error
    }
  }

  /**
   * 处理文本内容
   * @private
   */
  _processText(text) {
    // 如果包含Edge语法，直接返回
    if (this._isEdgeSyntax(text)) {
      return text
    }
    return text
  }

  /**
   * 检查是否包含Edge语法
   * @private
   */
  _isEdgeSyntax(text) {
    return this.edgeSyntaxPatterns.some((pattern) => text.includes(pattern))
  }

  /**
   * 处理指令
   * @private
   */
  async _processDirective(output, directive, ctx) {
    try {
      // 去掉开头的%和结尾的%
      directive = directive.replace(/^%\s*|\s*%$/g, '').trim()

      // 解析指令名和参数
      const match = directive.match(/^(\w+)(?:\s*\((.*?)\))?$/)
      if (!match) {
        throw new Error(`Invalid directive: ${directive}`)
      }

      const [, name, args = ''] = match
      this.logger.debug('解析指令', { name, args })

      // 获取当前作用域
      const currentScope = ctx.scope[ctx.scope.length - 1]

      // 如果是if指令
      if (name === 'if') {
        const condition = args.trim()
        const result = await this._evaluateCondition(condition, currentScope)
        ctx.stack.push({ type: 'if', value: result })
        return
      }

      // 如果是endif指令
      if (name === 'endif') {
        const lastIf = ctx.stack.pop()
        if (!lastIf || lastIf.type !== 'if') {
          throw new Error('Unexpected endif')
        }
        return
      }

      // 如果是each指令
      if (name === 'each') {
        // 支持两种格式：
        // 1. each(item in array)
        // 2. each item in array
        const eachMatch = args.match(/^(?:\(?(\w+)\s+in\s+(\w+(?:\.\w+)*)\)?|(\w+)\s+in\s+(\w+(?:\.\w+)*))$/)
        if (!eachMatch) {
          throw new Error(`Invalid each directive: ${args}`)
        }

        // 获取迭代变量名和数组名
        const itemName = eachMatch[1] || eachMatch[3]
        const arrayName = eachMatch[2] || eachMatch[4]

        if (!itemName || !arrayName) {
          throw new Error(`Invalid each directive: ${args}`)
        }

        const array = await this._getValue(arrayName, currentScope)
        if (!Array.isArray(array)) {
          throw new Error(`${arrayName} is not an array`)
        }

        ctx.stack.push({
          type: 'each',
          array,
          itemName,
          arrayName,
          content: [], // 用于收集each块内的内容
          index: 0,
        })
        return
      }

      // 如果是endeach指令
      if (name === 'endeach') {
        const lastEach = ctx.stack.pop()
        if (!lastEach || lastEach.type !== 'each') {
          throw new Error('Unexpected endeach')
        }
        return
      }

      // 如果是else指令
      if (name === 'else') {
        const lastIf = ctx.stack[ctx.stack.length - 1]
        if (!lastIf || lastIf.type !== 'if') {
          throw new Error('Unexpected else')
        }
        lastIf.value = !lastIf.value
        return
      }

      // 如果是elseif指令
      if (name === 'elseif') {
        const lastIf = ctx.stack[ctx.stack.length - 1]
        if (!lastIf || lastIf.type !== 'if') {
          throw new Error('Unexpected elseif')
        }
        if (!lastIf.value) {
          const condition = args.trim()
          lastIf.value = await this._evaluateCondition(condition, currentScope)
        }
        return
      }

      throw new Error(`Unknown directive: ${name}`)
    } catch (error) {
      this.logger.error('处理指令失败', {
        directive,
        error: error.message,
        line: ctx.line,
        column: ctx.column,
      })
      throw error
    }
  }

  /**
   * 处理变量
   * @private
   */
  _processVariable(text, ctx) {
    // 处理函数调用
    const functionMatch = text.match(/^(\w+)\((.*)\)$/)
    if (functionMatch) {
      const [_, funcName, argsText] = functionMatch
      const args = this._splitArgs(argsText)

      if (this.globalFunctions.has(funcName)) {
        return this._processFunction(funcName, args, ctx)
      }
    }

    // 处理普通变量
    const value = this._getValue(text, ctx.data)
    return value
  }

  /**
   * 分割参数，考虑引号
   * @private
   */
  _splitArgs(argsText) {
    const args = []
    let current = ''
    let inQuote = false
    let quoteChar = null

    for (let i = 0; i < argsText.length; i++) {
      const char = argsText[i]

      if ((char === '"' || char === "'") && argsText[i - 1] !== '\\') {
        if (!inQuote) {
          inQuote = true
          quoteChar = char
        } else if (char === quoteChar) {
          inQuote = false
        }
      }

      if (char === ',' && !inQuote) {
        args.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    if (current) {
      args.push(current.trim())
    }

    return args
  }

  /**
   * 处理函数调用
   * @private
   */
  _processFunction(name, args, ctx) {
    switch (name) {
      case 'trans':
        const processedArgs = this._processTransCall(args, ctx)
        return `{{ trans(${processedArgs.join(', ')}) }}`
      default:
        throw new GeneratorError(ERROR_CODES.TEMPLATE_FUNCTION_ERROR, ERROR_MESSAGES[ERROR_CODES.TEMPLATE_FUNCTION_ERROR], 'template_function_unknown')
    }
  }

  /**
   * 处理翻译函数调用
   * @private
   */
  _processTransCall(args, ctx) {
    return args.map((arg) => {
      // 检查是否是字符串字面量
      if (/^(['"]).*\1$/.test(arg.trim())) {
        // 如果是字符串字面量，直接返回
        return arg
      } else {
        // 如果是变量引用，进行替换
        const value = this._getValue(arg.trim(), ctx.data)
        return `'${value}'`
      }
    })
  }

  _processIf(output, condition, ctx) {
    const result = this._evaluateCondition(condition, ctx.data)
    ctx.stack.push({ type: 'if', condition: result })
    output.push(result ? '@if(' + this._escapeEdgeSyntax(condition) + ')' : '')
  }

  _processEndif(output, condition, ctx) {
    const result = this._evaluateCondition(condition, ctx.data)
    ctx.stack.pop()
    output.push(result ? '@endif' : '')
  }

  _processEach(output, expression, ctx) {
    const [item, list] = expression.split(' in ')
    const collection = this._getValue(list, ctx.data)
    ctx.stack.push({ type: 'each', item, list, index: 0 })
    output.push(`@each(${item} in ${this._escapeEdgeSyntax(list)})`)
  }

  _processEndeach(output, expression, ctx) {
    ctx.stack.pop()
    output.push('@endeach')
  }

  _processJson(output, key) {
    const value = this._getValue(key, ctx.data)
    output.push(JSON.stringify(value))
  }

  _escapeEdgeSyntax(expression) {
    // 转义Edge原生语法中的特殊字符
    return expression.replace(/@/g, '@@').replace(/{/g, '\\{').replace(/}/g, '\\}')
  }

  _escapeEdgeValue(value) {
    // 对生成的变量值进行安全转义
    if (typeof value === 'string') {
      return value.replace(/@each/g, '@@each').replace(/@if/g, '@@if').replace(/@json/g, '@@json')
    }
    return value
  }

  /**
   * 判断是否是全局函数调用
   */
  _isGlobalFunction(expression) {
    const functionName = expression.split('(')[0].trim()
    return this.globalFunctions.has(functionName)
  }

  /**
   * 评估条件表达式
   * @private
   */
  async _evaluateCondition(condition, data) {
    try {
      this.logger.debug('评估条件表达式:', { condition, data })

      // 1. 处理比较表达式
      const comparisonMatch = condition.match(/^(.+?)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/)
      if (comparisonMatch) {
        const [, left, operator, right] = comparisonMatch

        // 获取左值
        const leftValue = this._getValue(left.trim(), data)

        // 获取右值(如果是字符串字面量则直接使用)
        let rightValue = right.trim()
        if (rightValue.startsWith("'") || rightValue.startsWith('"')) {
          rightValue = rightValue.slice(1, -1)
        } else {
          rightValue = this._getValue(rightValue, data)
        }

        this.logger.debug('比较表达式解析结果:', {
          left: leftValue,
          operator,
          right: rightValue,
        })

        // 执行比较
        switch (operator) {
          case '===':
          case '==':
            return leftValue === rightValue
          case '!==':
          case '!=':
            return leftValue !== rightValue
          case '>':
            return leftValue > rightValue
          case '>=':
            return leftValue >= rightValue
          case '<':
            return leftValue < rightValue
          case '<=':
            return leftValue <= rightValue
          default:
            throw new Error(`不支持的操作符: ${operator}`)
        }
      }

      // 2. 处理逻辑表达式
      if (condition.includes('&&')) {
        const parts = condition.split('&&').map((p) => p.trim())
        return parts.every((part) => this._evaluateCondition(part, data))
      }

      if (condition.includes('||')) {
        const parts = condition.split('||').map((p) => p.trim())
        return parts.some((part) => this._evaluateCondition(part, data))
      }

      // 3. 处理简单条件(直接获取值)
      const value = this._getValue(condition, data)
      return Boolean(value)
    } catch (err) {
      this.logger.error('评估条件失败:', {
        condition,
        error: err.message,
        stack: err.stack,
      })
      return false
    }
  }

  /**
   * 检查表达式是否包含全局函数
   */
  _containsGlobalFunction(expression) {
    return Array.from(this.globalFunctions).some((func) => expression.includes(func + '('))
  }

  /**
   * 替换变量
   * @private
   */
  async _replaceVariables(expression, data) {
    return expression.replace(/\$\{([^}]+)\}/g, (match, path) => {
      const value = this._getValue(path.trim(), data)
      return typeof value === 'string' ? `'${value}'` : value
    })
  }

  /**
   * 获取对象路径的值
   */
  _getValueByPath(obj, path) {
    if (!path) return obj
    const parts = path.split('.')
    let result = obj
    for (const part of parts) {
      if (result == null) return undefined
      result = result[part]
    }
    return result
  }

  /**
   * 添加TODO注释
   */
  _addTodoComments(template) {
    // 在生成的文件开头添加全局TODO注释
    return `<!--
TODO: 请注意以下事项：
1. 本文件由代码生成器生成，可能需要根据实际需求进行调整
2. 请检查所有带有 TODO 注释的地方，补充相应的数据或逻辑
3. trans() 函数会在运行时由系统提供，用于国际化翻译
-->\n\n${template}`
  }

  /**
   * 评估表达式
   * @private
   */
  _evaluateExpression(expression, data) {
    try {
      return this._getValueByPath(data, expression)
    } catch (error) {
      throw new GeneratorError(ERROR_CODES.TEMPLATE_RENDER_ERROR, `表达式求值失败: ${expression}`, 'template_evaluateExpression_error')
    }
  }

  /**
   * 处理过滤器
   * @private
   */
  _processFilters(value, filters) {
    if (!filters) return value

    return filters.split('|').reduce((result, filterStr) => {
      filterStr = filterStr.trim()
      const [filterName, ...args] = filterStr.split(':')

      if (!this.filters[filterName]) {
        throw new GeneratorError(ERROR_CODES.TEMPLATE_ERROR, `未知的过滤器: ${filterName}`, 'template_processFilters_unknown')
      }

      try {
        return this.filters[filterName](result, ...args)
      } catch (error) {
        throw new GeneratorError(ERROR_CODES.TEMPLATE_ERROR, `过滤器执行失败: ${filterName}`, 'template_processFilters_error', {
          value: result,
          filter: filterName,
          error,
        })
      }
    }, value)
  }

  /**
   * 获取变量值
   * @private
   * @param {string} path 变量路径
   * @param {Object} data 数据对象
   * @returns {*} 变量值
   */
  _getValue(path, data) {
    try {
      this.logger.debug('获取变量值:', { path, data })

      if (!path) {
        throw new GeneratorError(ERROR_CODES.TEMPLATE_VARIABLE_ERROR, '变量路径不能为空')
      }

      // 处理过滤器
      const [valuePath, ...filters] = path.split('|').map((p) => p.trim())

      // 处理数组索引和对象属性访问
      const parts = valuePath.split('.')
      let value = data

      for (const part of parts) {
        // 如果当前值是undefined或null，返回空字符串
        if (value === undefined || value === null) {
          this.logger.debug('变量值为空:', { path: valuePath, part, value })
          return ''
        }

        // 检查是否是数组索引访问
        const arrayMatch = part.match(/(\w+)\[(\d+)\]/)
        if (arrayMatch) {
          const [, name, index] = arrayMatch
          value = value[name]?.[parseInt(index, 10)]
        } else {
          // 如果属性不存在，返回空字符串而不是undefined
          value = value[part] ?? ''
        }
      }

      // 应用过滤器
      if (filters.length > 0) {
        value = filters.reduce((result, filterName) => {
          if (!this.filters[filterName]) {
            this.logger.warn('未知的过滤器:', { filterName })
            return result
          }
          return this.filters[filterName](result)
        }, value)
      }

      this.logger.debug('获取变量值成功:', { path, value, filters })
      return value
    } catch (err) {
      this.logger.error('获取变量值失败:', {
        error: err,
        path,
        data,
        stack: err.stack,
      })
      // 出错时返回空字符串而不是抛出异常
      return ''
    }
  }

  /**
   * 处理else指令
   * @private
   */
  _processElse(output, args, ctx) {
    try {
      this.logger.debug('处理else指令')

      // 检查是否在if块内
      const lastBlock = ctx.stack[ctx.stack.length - 1]
      if (!lastBlock || lastBlock.type !== 'if') {
        throw new GeneratorError(ERROR_CODES.TEMPLATE_SYNTAX_ERROR, 'else指令必须在if块内使用', 'template_else_without_if')
      }

      // 更新堆栈状态
      lastBlock.condition = !lastBlock.condition

      // 输出Edge模板语法
      output.push('@else')
    } catch (err) {
      this.logger.error('处理else指令失败:', { error: err, stack: err.stack })
      throw err
    }
  }

  /**
   * 处理elseif指令
   * @private
   */
  _processElseif(output, condition, ctx) {
    try {
      this.logger.debug('处理elseif指令:', { condition })

      // 检查是否在if块内
      const lastBlock = ctx.stack[ctx.stack.length - 1]
      if (!lastBlock || lastBlock.type !== 'if') {
        throw new GeneratorError(ERROR_CODES.TEMPLATE_SYNTAX_ERROR, 'elseif指令必须在if块内使用', 'template_elseif_without_if')
      }

      // 只有当前面的条件都为false时才评估新条件
      const shouldEvaluate = !lastBlock.condition
      const result = shouldEvaluate ? this._evaluateCondition(condition, ctx.data) : false

      // 更新堆栈状态
      lastBlock.condition = lastBlock.condition || result

      // 输出Edge模板语法
      output.push(shouldEvaluate ? `@elseif(${this._escapeEdgeSyntax(condition)})` : '')
    } catch (err) {
      this.logger.error('处理elseif指令失败:', {
        error: err,
        condition,
        stack: err.stack,
      })
      throw err
    }
  }

  /**
   * 将模板字符串转换为token数组
   * @private
   */
  _tokenize(template) {
    const tokens = []
    let current = 0
    let mode = 'text'
    let buffer = ''
    let line = 1
    let column = 1

    const addToken = (type, value) => {
      if (value) {
        tokens.push({
          type,
          value,
          line,
          column: column - value.length,
        })
      }
    }

    while (current < template.length) {
      const char = template[current]

      // 更新行列信息
      if (char === '\n') {
        line++
        column = 1
      } else {
        column++
      }

      // 处理指令开始 <%
      if (template.slice(current, current + 2) === '<%') {
        if (buffer) {
          addToken('text', buffer)
          buffer = ''
        }
        current += 2
        mode = 'directive'
        continue
      }

      // 处理指令结束 %>
      if (mode === 'directive' && template.slice(current, current + 2) === '%>') {
        addToken('directive', buffer.trim())
        buffer = ''
        current += 2
        mode = 'text'
        continue
      }

      // 处理变量替换开始 ${
      if (template.slice(current, current + 2) === '${') {
        if (buffer) {
          addToken('text', buffer)
          buffer = ''
        }
        current += 2
        mode = 'variable'
        continue
      }

      // 处理变量替换结束 }
      if (mode === 'variable' && char === '}') {
        addToken('variable', buffer.trim())
        buffer = ''
        current += 1
        mode = 'text'
        continue
      }

      // 累积字符
      buffer += char
      current++
    }

    // 处理剩余的buffer
    if (buffer) {
      addToken(mode, buffer)
    }

    return tokens
  }
}

module.exports = TemplateEngine
