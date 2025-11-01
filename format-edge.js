// format-edge.js - Edge 模板格式化工具（只处理缩进对齐）
const fs = require('fs')
const path = require('path')

/**
 * Edge 格式化器类
 */
class EdgeFormatter {
  constructor(options = {}) {
    this.indentSize = options.indentSize || 2

    // Edge 关键词列表
    this.edgeKeywords = new Set([
      '@layout',
      '@section',
      '@endsection',
      '@if',
      '@endif',
      '@else',
      '@elseif',
      '@each',
      '@endeach',
      '@include',
      '@component',
      '@slot',
    ])

    // 结束标签（会减少缩进）
    this.closingTags = new Set(['@endsection', '@endif', '@endeach'])

    // 顶级标签（不缩进）
    this.topLevelTags = new Set(['@layout', '@section', '@endsection'])

    // 需要增加缩进的开始标签
    this.openingTags = new Set(['@if', '@each', '@section'])
  }

  /**
   * 提取 Edge 关键词（从行中提取，处理 @if() 这种情况）
   */
  extractEdgeKeyword(line) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('@')) {
      return null
    }
    // 匹配 @keyword( 或 @keyword 后跟空格/换行
    const match = trimmed.match(/^@([a-z]+)/i)
    return match ? '@' + match[1].toLowerCase() : null
  }

  /**
   * 判断是否是顶级标签
   */
  isTopLevelTag(line) {
    const keyword = this.extractEdgeKeyword(line)
    return keyword && this.topLevelTags.has(keyword)
  }

  /**
   * 判断是否是开始标签
   */
  isOpeningTag(line) {
    const keyword = this.extractEdgeKeyword(line)
    return keyword && this.openingTags.has(keyword)
  }

  /**
   * 判断是否是结束标签
   */
  isClosingTag(line) {
    const keyword = this.extractEdgeKeyword(line)
    return keyword && this.closingTags.has(keyword)
  }

  /**
   * 判断是否是 Edge 关键词
   */
  isEdgeKeyword(line) {
    return this.extractEdgeKeyword(line) !== null
  }

  /**
   * 更新缩进级别（基于 HTML 标签）
   */
  updateIndentLevel(line, updateFn) {
    // 匹配 HTML 开始标签（非自闭合）
    const openTags = line.match(/<([a-z][a-z0-9-]*)[^>]*(?<!\/)>/gi)
    // 匹配 HTML 结束标签
    const closeTags = line.match(/<\/([a-z][a-z0-9-]*)>/gi)
    // 匹配自闭合标签
    const selfCloseTags = line.match(/<[a-z][a-z0-9-]*[^>]*\/>/gi)

    let openCount = 0
    let closeCount = 0

    if (openTags) {
      // 排除自闭合标签
      const realOpenTags = openTags.filter((tag) => {
        if (!selfCloseTags) return true
        // 移除尾部的 / 和 > 来比较
        const normalizedTag = tag.replace(/\s*\/\s*>$/, '>')
        return !selfCloseTags.some((selfClose) => normalizedTag === selfClose.replace(/\s*\/\s*>$/, '>'))
      })
      openCount = realOpenTags.length
    }

    if (closeTags) {
      closeCount = closeTags.length
    }

    const delta = openCount - closeCount
    if (delta !== 0) {
      updateFn(delta)
    }
  }

  /**
   * 计算 JavaScript 代码的括号平衡（用于更新缩进层级）
   * 从第一性原理出发：缩进由 { } [ ] 控制，简单统计数量差即可
   * @param {string} line 代码行
   * @returns {number} 括号平衡值（正数增加缩进，负数减少缩进）
   */
  calculateJavascriptBalance(line) {
    const trimmed = line.trim()
    if (!trimmed) return 0

    // 只统计花括号和方括号（圆括号通常不用于缩进控制）
    const openBraces = (trimmed.match(/{/g) || []).length
    const closeBraces = (trimmed.match(/}/g) || []).length
    const openBrackets = (trimmed.match(/\[/g) || []).length
    const closeBrackets = (trimmed.match(/\]/g) || []).length

    // 返回括号平衡（{ 和 [ 增加缩进，} 和 ] 减少缩进）
    return openBraces - closeBraces + (openBrackets - closeBrackets)
  }

  /**
   * 格式化 Edge 文件内容
   * @param {string} content 文件内容
   * @returns {string} 格式化后的内容
   */
  format(content) {
    const lines = content.split('\n')
    const formatted = []
    let indentLevel = 0
    let inScript = false
    let inStyle = false
    let scriptBaseIndent = 0
    let scriptIndentLevel = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      const isEmpty = trimmed === ''

      // 检测 script/style 标签
      // 检查是否是完整的 script 标签（同一行有 </script>，即自闭合或完整标签）
      const isCompleteScriptTag = trimmed.match(/^<script[^>]*>.*<\/script>/i)
      const isScriptStart = trimmed.match(/^<script[^>]*>/i) && !isCompleteScriptTag
      const isScriptEnd = trimmed.match(/^<\/script>/i)

      if (isScriptStart) {
        // script 开始标签：先用当前缩进级别格式化这个标签，然后进入 script 模式
        formatted.push(' '.repeat(indentLevel * this.indentSize) + trimmed)
        inScript = true
        scriptBaseIndent = indentLevel + 1 // script标签后的内容需要缩进
        scriptIndentLevel = 0
        continue
      } else if (isScriptEnd) {
        // script 结束标签：先格式化，然后退出 script 模式
        formatted.push(' '.repeat(indentLevel * this.indentSize) + trimmed)
        inScript = false
        scriptBaseIndent = 0
        scriptIndentLevel = 0
        continue
      }

      // 检查是否是完整的 style 标签
      const isCompleteStyleTag = trimmed.match(/^<style[^>]*>.*<\/style>/i)
      const isStyleStart = trimmed.match(/^<style[^>]*>/i) && !isCompleteStyleTag

      if (isStyleStart) {
        inStyle = true
      } else if (trimmed.match(/^<\/style>/i)) {
        inStyle = false
      }

      // 在 script 标签内的处理（需要处理 JavaScript 缩进）
      if (inScript) {
        if (isEmpty) {
          formatted.push('')
        } else {
          // 计算括号平衡（用于更新下一行的缩进）
          const balance = this.calculateJavascriptBalance(trimmed)

          // 如果这一行以 } 或 ] 开头（去空格后），说明这一行是闭合一个块
          // 格式化当前行时应该减少缩进，但更新下一行缩进时要用完整的括号平衡
          const startsWithClose = /^\s*[}\]]/.test(line)
          let currentIndentLevel = scriptIndentLevel

          if (startsWithClose && currentIndentLevel > 0) {
            // 格式化当前行时使用减少后的缩进
            currentIndentLevel -= 1
          }

          // 使用计算出的缩进级别格式化当前行
          const currentIndent = scriptBaseIndent + currentIndentLevel
          const indent = ' '.repeat(currentIndent * this.indentSize)
          formatted.push(indent + trimmed)

          // 更新下一行的缩进级别：直接使用完整的括号平衡
          // 对于 } else {，balance = 0，但是因为我们格式化时减少过缩进，
          // 这里需要用 balance 来更新，balance=0 意味着下一行应该和这一行对齐
          // 但是由于 else { 开启了新块，实际上应该增加缩进
          // 所以我们应该基于这一行是否有开启的块来决定
          scriptIndentLevel += balance

          // 确保缩进级别不为负
          scriptIndentLevel = Math.max(0, scriptIndentLevel)
        }
        continue
      }

      // 在 style 标签内的处理
      if (inStyle) {
        if (isEmpty) {
          formatted.push('')
        } else {
          const indent = ' '.repeat((indentLevel + 1) * this.indentSize)
          formatted.push(indent + trimmed)
        }
        continue
      }

      // 检测 Edge 关键词
      const isEdgeKeyword = this.isEdgeKeyword(line)
      const isClosingTag = this.isClosingTag(line)
      const isTopLevelTag = this.isTopLevelTag(line)
      const isOpeningTag = this.isOpeningTag(line)

      // 处理空行
      if (isEmpty) {
        formatted.push('')
        continue
      }

      // Edge 关键词处理
      if (isEdgeKeyword) {
        if (isTopLevelTag) {
          // 顶级标签不缩进
          formatted.push(trimmed)
          // @section 后的内容不缩进（保持与 @section 对齐）
          // @layout 后的内容也不缩进
          indentLevel = 0
        } else {
          // 对于结束标签（如 @endif），先减少缩进级别再格式化
          if (isClosingTag && indentLevel > 0) {
            indentLevel--
          }

          // 使用当前缩进级别格式化
          formatted.push(' '.repeat(indentLevel * this.indentSize) + trimmed)

          // 对于开始标签（如 @if），在格式化后增加缩进级别（用于后续内容）
          if (isOpeningTag) {
            indentLevel++
          }
        }
        continue
      }

      // HTML 内容处理
      // 计算这一行应该使用的缩进级别
      let currentIndentLevel = indentLevel

      // 检测是否是标签属性行（上一行是不完整的标签，当前行是属性）
      if (formatted.length > 0) {
        const prevLine = formatted[formatted.length - 1]
        const prevTrimmed = prevLine ? prevLine.trim() : ''
        // 上一行是未闭合的标签（以 < 开头，不以 > 结尾）
        const prevIsIncompleteTag = prevTrimmed.match(/^<[a-z][^>]*[^/>]$/)
        // 当前行看起来像属性行（以属性名或属性值开头，或以 > 结尾）
        const isAttributeLine =
          !trimmed.match(/^</) &&
          (trimmed.match(/^(class|id|href|src|type|name|value|placeholder|method|action|data-|aria-)/i) || trimmed.match(/^[a-z-]+=/i) || trimmed.match(/>$/))

        if (prevIsIncompleteTag && isAttributeLine) {
          // 上一行是不完整的标签，当前行是属性，使用相同的缩进
          const prevIndent = prevLine.length - prevLine.trimStart().length
          formatted.push(' '.repeat(prevIndent) + trimmed)

          // 更新缩进级别（如果这行包含闭合标签 >）
          this.updateIndentLevel(trimmed, (delta) => {
            indentLevel = Math.max(0, indentLevel + delta)
          })
          continue
        }
      }

      // 检测是否是纯结束标签（只有结束标签，没有开始标签）
      const hasCloseTag = trimmed.match(/<\/([a-z][a-z0-9-]*)>/i)
      // 检测是否有开始标签
      const openTagMatch = trimmed.match(/<([a-z][a-z0-9-]*)[^>/]*>/gi)
      const selfCloseMatch = trimmed.match(/<[a-z][^>]*\/>/gi)
      const hasOpenTag =
        openTagMatch &&
        openTagMatch.some((tag) => {
          if (!selfCloseMatch) return true
          const normalized = tag.replace(/\s*\/\s*>$/, '>').trim()
          return !selfCloseMatch.some((selfClose) => normalized === selfClose.replace(/\s*\/\s*>$/, '>').trim())
        })

      // 如果只有结束标签（没有开始标签），这一行应该使用减少后的缩进
      if (hasCloseTag && !hasOpenTag) {
        currentIndentLevel = Math.max(0, indentLevel - 1)
      }

      // 使用计算出的缩进级别格式化当前行
      formatted.push(' '.repeat(currentIndentLevel * this.indentSize) + trimmed)

      // 更新缩进级别（用于下一行）
      this.updateIndentLevel(trimmed, (delta) => {
        indentLevel = Math.max(0, indentLevel + delta)
      })
    }

    return this.normalizeBlankLines(formatted).join('\n')
  }

  /**
   * 规范化空行（确保 Edge 顶级关键词之间有空行）
   */
  normalizeBlankLines(lines) {
    const result = []
    const edgeKeywordPattern = /^@(layout|section|endsection|if|endif|else|elseif|each|endeach|include|component|slot)/

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      const isEmpty = trimmed === ''
      const isEdgeKeyword = edgeKeywordPattern.test(trimmed)

      // 跳过连续的空行（保留一个）
      if (isEmpty) {
        if (result.length > 0 && result[result.length - 1] !== '') {
          result.push('')
        }
        continue
      }

      // 如果是 Edge 关键词
      if (isEdgeKeyword) {
        // 检查是否是顶级标签
        const isTopLevel = this.isTopLevelTag(line)

        // 如果前一行也是 Edge 关键词或非空行，且当前是顶级标签，添加空行
        if (result.length > 0 && result[result.length - 1] !== '') {
          const prevLine = result[result.length - 1].trim()
          const prevIsEdgeKeyword = edgeKeywordPattern.test(prevLine)
          const prevIsTopLevel = prevIsEdgeKeyword && this.isTopLevelTag(result[result.length - 1])

          // 顶级标签之间需要空行
          if ((prevIsTopLevel && isTopLevel) || (prevIsEdgeKeyword && isTopLevel)) {
            result.push('')
          }
        }
      }

      result.push(line)
    }

    return result
  }
}

/**
 * 格式化文件
 */
function formatFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const formatter = new EdgeFormatter({ indentSize: 2 })
    const formatted = formatter.format(content)
    fs.writeFileSync(filePath, formatted, 'utf-8')
    console.log(`✓ Formatted: ${filePath}`)
    return true
  } catch (error) {
    console.error(`✗ Error formatting ${filePath}:`, error.message)
    return false
  }
}

/**
 * 批量格式化目录下的所有 Edge 文件
 */
function formatDirectory(dirPath) {
  const files = []

  function findEdgeFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        findEdgeFiles(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.edge')) {
        files.push(fullPath)
      }
    }
  }

  findEdgeFiles(dirPath)
  return files
}

// 命令行使用
if (require.main === module) {
  const args = process.argv.slice(2)

  // 如果没有参数，批量处理 resources/views 目录
  if (args.length === 0) {
    const viewsDir = path.join(process.cwd(), 'resources/views')
    if (!fs.existsSync(viewsDir)) {
      console.error(`Directory not found: ${viewsDir}`)
      process.exit(1)
    }

    console.log(`Formatting all .edge files in ${viewsDir}...\n`)
    const files = formatDirectory(viewsDir)

    if (files.length === 0) {
      console.log('No .edge files found.')
      process.exit(0)
    }

    let successCount = 0
    let failCount = 0

    for (const file of files) {
      const success = formatFile(file)
      if (success) {
        successCount++
      } else {
        failCount++
      }
    }

    console.log(`\n✓ Formatted ${successCount} file(s)`)
    if (failCount > 0) {
      console.log(`✗ Failed to format ${failCount} file(s)`)
    }

    process.exit(failCount > 0 ? 1 : 0)
  } else {
    // 单文件模式
    const filePath = args[0]
    const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)

    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`)
      process.exit(1)
    }

    const success = formatFile(fullPath)
    process.exit(success ? 0 : 1)
  }
}

module.exports = { EdgeFormatter, formatFile, formatDirectory }
