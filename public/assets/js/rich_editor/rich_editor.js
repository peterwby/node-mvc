/**
 * RichEditor 类 - 基于 Quill 的富文本编辑器封装
 * @class
 */
class RichEditor {
  static _initialized = false
  static _presets = {
    simple: {
      modules: {
        toolbar: [[{ header: [1, 2, false] }], ['bold', 'italic', 'underline'], ['image', 'code-block'], ['clean']],
      },
      placeholder: '请输入内容',
      theme: 'snow', // 必须设置 theme 才会显示工具栏
    },
    full: {
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'], // 文字格式
          ['blockquote', 'code-block'], // 引用和代码块
          [{ header: 1 }, { header: 2 }], // 标题
          [{ list: 'ordered' }, { list: 'bullet' }], // 列表
          [{ indent: '-1' }, { indent: '+1' }], // 缩进
          [{ direction: 'rtl' }], // 文字方向
          [{ size: ['small', false, 'large', 'huge'] }], // 字体大小
          [{ header: [1, 2, 3, 4, 5, 6, false] }], // 标题大小
          ['link', 'image', 'video'], // 链接、图片、视频
          [{ color: [] }, { background: [] }], // 字体颜色、背景颜色
          [{ font: [] }], // 字体
          [{ align: [] }], // 对齐方式
          ['clean'], // 清除格式
        ],
      },
      placeholder: '请输入内容',
      theme: 'snow',
    },
    readonly: {
      readOnly: true,
      modules: {
        toolbar: false,
      },
      theme: 'snow',
    },
  }

  /**
   * 私有初始化方法
   * @private
   */
  static async _initialize() {
    if (this._initialized) return

    try {
      // 加载必要的CSS
      await this._loadCSS('/assets/js/rich_editor/rich_editor.css')
      this._initialized = true
    } catch (error) {
      console.error('RichEditor初始化失败:', error)
      throw new Error('RichEditor初始化失败')
    }
  }

  /**
   * 工具方法：加载CSS
   * @private
   * @param {string} url - CSS文件的URL
   * @returns {Promise<void>}
   */
  static async _loadCSS(url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${url}"]`)) {
        resolve()
        return
      }

      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      link.onload = resolve
      link.onerror = reject
      document.head.appendChild(link)
    })
  }

  /**
   * 构造函数
   * @param {string|HTMLElement} container - 容器元素或选择器
   * @param {string|Object} options - 预设配置名称或自定义配置
   * @throws {Error} 如果初始化失败或容器元素未找到
   */
  constructor(container, options = 'simple') {
    if (!container) {
      throw new Error('必须指定目标元素')
    }

    // 确保RichEditor已初始化
    return (async () => {
      await RichEditor._initialize()

      const element = typeof container === 'string' ? document.querySelector(container) : container
      if (!element) {
        throw new Error(`未找到目标元素: ${container}`)
      }

      // 获取配置
      const config = typeof options === 'string' ? RichEditor._presets[options] : options
      if (!config) {
        throw new Error(`未找到预设配置: ${options}`)
      }

      // 创建编辑器实例
      this.quill = new Quill(element, config)
      return this
    })()
  }

  /**
   * 获取原始的 Quill 实例
   * @returns {Quill} Quill编辑器实例
   * @throws {Error} 如果编辑器实例不存在
   */
  getQuill() {
    if (!this.quill) {
      throw new Error('编辑器实例不存在')
    }
    return this.quill
  }

  /**
   * 获取编辑器内容
   * @returns {Object} Delta 格式的内容
   * @throws {Error} 如果编辑器实例不存在
   */
  getContents() {
    if (!this.quill) {
      throw new Error('编辑器实例不存在')
    }
    return this.quill.getContents()
  }

  /**
   * 设置编辑器内容
   * @param {Object|string} content - Delta 对象或 HTML 字符串
   * @throws {Error} 如果编辑器实例不存在或设置失败
   */
  setContents(content) {
    if (!this.quill) {
      throw new Error('编辑器实例不存在')
    }

    try {
      if (typeof content === 'string') {
        this.quill.clipboard.dangerouslyPasteHTML(content)
      } else {
        this.quill.setContents(content)
      }
    } catch (error) {
      throw new Error(`设置内容失败: ${error.message}`)
    }
  }
}

// 导出
window.RichEditor = RichEditor
