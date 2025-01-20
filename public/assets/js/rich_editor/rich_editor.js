/**
 * RichEditor 类 - 基于 Quill v2.0 的富文本编辑器封装
 * @class
 */
class RichEditor {
  static _initialized = false

  /**
   * 注册插件到 Quill
   * @private
   */
  static _registerPlugins() {
    // 注册图片处理插件
    Quill.register('modules/imageHandler', ImageHandler)
  }

  static _presets = {
    simple: {
      modules: {
        toolbar: [[{ header: [1, 2, false] }], ['bold', 'italic', 'underline'], ['image', 'code-block'], ['clean']],
        imageHandler: {
          uploadUrl: '/api/upload/image', // 自定义上传地址
        },
      },
      placeholder: '请输入内容',
      theme: 'snow',
    },
    full: {
      modules: {
        toolbar: {
          container: [
            [{ font: [] }], // 字体
            [{ header: [1, 2, 3, 4, 5, 6, false] }], // 标题
            ['bold', 'italic', 'underline', 'strike'], // 文字格式
            [{ color: [] }, { background: [] }], // 颜色
            [{ script: 'super' }, { script: 'sub' }], // 上下标
            ['blockquote', 'code-block'], // 引用和代码块
            [{ list: 'ordered' }, { list: 'bullet' }], // 列表
            [{ indent: '-1' }, { indent: '+1' }], // 缩进
            [{ direction: 'rtl' }], // 文字方向
            [{ align: [] }], // 对齐
            ['link', 'image', 'video'], // 链接、图片、视频
            ['table'], // 表格
            ['clean'], // 清除格式
          ],
          handlers: {
            table: function (value) {
              const tableModule = this.quill.getModule('table')
              if (!tableModule) return

              // 创建表格选择UI
              const container = document.createElement('div')
              container.className = 'ql-table-picker'
              container.style.cssText = `
                position: absolute;
                background: white;
                border: 1px solid #e4e6ef;
                padding: 1rem;
                border-radius: 0.475rem;
                box-shadow: 0 0 50px 0 rgb(82 63 105 / 15%);
                z-index: 1000;
                min-width: 300px;
              `

              // 添加标题
              const title = document.createElement('div')
              title.textContent = '插入表格'
              title.style.cssText = `
                margin-bottom: 1rem;
                font-weight: 500;
                font-size: 1.075rem;
                color: #181c32;
              `
              container.appendChild(title)

              // 添加行列输入
              const inputContainer = document.createElement('div')
              inputContainer.style.cssText = `
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
              `

              // 行数输入
              const rowInput = document.createElement('div')
              rowInput.style.flex = '1'
              rowInput.innerHTML = `
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #3f4254;">行数</label>
                <input type="number" min="1" max="10" value="3" class="row-input" style="
                  width: 80%;
                  padding: 0.75rem 1rem;
                  font-size: 0.875rem;
                  font-weight: 400;
                  line-height: 1.5;
                  color: #181c32;
                  background-color: #ffffff;
                  background-clip: padding-box;
                  border: 1px solid #e4e6ef;
                  appearance: none;
                  border-radius: 0.475rem;
                  box-shadow: none;
                  transition: border-color 0.15s ease-in-out;
                ">
              `

              // 列数输入
              const colInput = document.createElement('div')
              colInput.style.flex = '1'
              colInput.innerHTML = `
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #3f4254;">列数</label>
                <input type="number" min="1" max="10" value="3" class="col-input" style="
                  width: 80%;
                  padding: 0.75rem 1rem;
                  font-size: 0.875rem;
                  font-weight: 400;
                  line-height: 1.5;
                  color: #181c32;
                  background-color: #ffffff;
                  background-clip: padding-box;
                  border: 1px solid #e4e6ef;
                  appearance: none;
                  border-radius: 0.475rem;
                  box-shadow: none;
                  transition: border-color 0.15s ease-in-out;
                ">
              `

              inputContainer.appendChild(rowInput)
              inputContainer.appendChild(colInput)
              container.appendChild(inputContainer)

              // 添加按钮
              const buttonContainer = document.createElement('div')
              buttonContainer.style.cssText = `
                display: flex;
                gap: 0.5rem;
                justify-content: flex-end;
              `

              const cancelBtn = document.createElement('button')
              cancelBtn.textContent = '取消'
              cancelBtn.className = 'ql-table-picker-btn'
              cancelBtn.style.cssText = `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
                font-weight: 500;
                line-height: 1.5;
                color: #3f4254;
                text-align: center;
                vertical-align: middle;
                cursor: pointer;
                user-select: none;
                background-color: transparent;
                border: 1px solid #e4e6ef;
                border-radius: 0.475rem;
                transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                min-height: 38px;
              `

              const insertBtn = document.createElement('button')
              insertBtn.textContent = '插入'
              insertBtn.className = 'ql-table-picker-btn'
              insertBtn.style.cssText = `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
                font-weight: 500;
                line-height: 1.5;
                color: #ffffff;
                text-align: center;
                vertical-align: middle;
                cursor: pointer;
                user-select: none;
                background-color: #009ef7;
                border: 1px solid #009ef7;
                border-radius: 0.475rem;
                transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                min-height: 38px;
              `

              buttonContainer.appendChild(cancelBtn)
              buttonContainer.appendChild(insertBtn)
              container.appendChild(buttonContainer)

              // 获取工具栏位置
              const toolbar = this.quill.getModule('toolbar')
              const tableButton = toolbar.container.querySelector('.ql-table')
              const rect = tableButton.getBoundingClientRect()

              // 定位选择器
              container.style.left = `${rect.left}px`
              container.style.top = `${rect.bottom + 5}px`

              // 添加到文档
              document.body.appendChild(container)

              // 事件处理
              const closeDialog = () => {
                document.body.removeChild(container)
                document.removeEventListener('click', handleOutsideClick)
              }

              const handleOutsideClick = (e) => {
                if (!container.contains(e.target) && !tableButton.contains(e.target)) {
                  closeDialog()
                }
              }

              // 延迟添加点击监听，避免立即触发
              setTimeout(() => {
                document.addEventListener('click', handleOutsideClick)
              })

              // 取消按钮
              cancelBtn.onclick = closeDialog

              // 插入按钮
              insertBtn.onclick = () => {
                try {
                  // 使用类选择器准确获取行列输入框
                  const rowsInput = container.querySelector('.row-input')
                  const colsInput = container.querySelector('.col-input')

                  // 获取输入值，如果无效则使用默认值
                  let rows = 3,
                    cols = 3

                  if (rowsInput && !isNaN(rowsInput.value) && rowsInput.value !== '') {
                    rows = parseInt(rowsInput.value)
                  }

                  if (colsInput && !isNaN(colsInput.value) && colsInput.value !== '') {
                    cols = parseInt(colsInput.value)
                  }

                  // 限制行列数范围
                  rows = Math.min(Math.max(rows, 1), 10)
                  cols = Math.min(Math.max(cols, 1), 10)

                  // 确保焦点在编辑器内
                  this.quill.focus()

                  // 获取当前选区
                  const range = this.quill.getSelection(true)

                  // 如果没有选区，设置到末尾
                  if (!range) {
                    this.quill.setSelection(this.quill.getLength(), 0)
                  }

                  // 插入表格：确保行列顺序正确
                  setTimeout(() => {
                    console.log(`插入表格：${rows}行 x ${cols}列`)
                    tableModule.insertTable(rows, cols)
                  }, 0)

                  // 关闭对话框
                  closeDialog()
                } catch (error) {
                  console.error('插入表格失败:', error)
                  closeDialog()
                }
              }
            },
          },
        },
        table: {
          // 表格模块配置
          operationMenu: {
            insertColumnRight: true, // 右侧插入列
            insertColumnLeft: true, // 左侧插入列
            insertRowUp: true, // 上方插入行
            insertRowDown: true, // 下方插入行
            deleteColumn: true, // 删除列
            deleteRow: true, // 删除行
            deleteTable: true, // 删除表格
          },
          resizable: {
            enabled: true, // 允许调整表格大小
          },
        },
        keyboard: {
          bindings: {
            // 添加表格相关的快捷键
            tab: {
              key: 9,
              handler: function (range, context) {
                if (context.format.table) {
                  // 在表格中按Tab键时移动到下一个单元格
                  return true
                }
                return false
              },
            },
          },
        },
        // 启用图片处理插件（可选自定义配置）
        imageHandler: {
          uploadUrl: '/api/upload/image', // 自定义上传地址
        },
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
      // 注册插件
      this._registerPlugins()
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
