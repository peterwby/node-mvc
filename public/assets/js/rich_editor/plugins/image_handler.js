class ImageHandler {
  constructor(quill, options) {
    this.quill = quill
    // 默认配置
    const defaults = {
      maxSize: 10 * 1024 * 1024, // 默认10MB
      uploadUrl: '/api/upload/image', // 默认上传地址
      allowedTypes: {
        'image/jpeg': ['jpg', 'jpeg'],
        'image/png': ['png'],
        'image/gif': ['gif'],
        'image/webp': ['webp'],
      },
    }
    // 合并配置
    this.options = { ...defaults, ...options }
    this.fileInput = null

    // 绑定图片处理器
    const toolbar = this.quill.getModule('toolbar')
    if (toolbar) {
      toolbar.addHandler('image', this.selectImage.bind(this))
    }

    // 绑定拖拽上传
    this.handleDrop = this.handleDrop.bind(this)
    this.handlePaste = this.handlePaste.bind(this)
    this.quill.root.addEventListener('drop', this.handleDrop)
    this.quill.root.addEventListener('paste', this.handlePaste)

    // 在编辑器销毁时清理
    this.quill.on('destroy', this.destroy.bind(this))

    // 创建进度提示元素
    this.createProgressElement()
  }

  destroy() {
    // 清理事件监听器
    this.quill.root.removeEventListener('drop', this.handleDrop)
    this.quill.root.removeEventListener('paste', this.handlePaste)
    // 清理文件输入框
    if (this.fileInput) {
      this.fileInput.remove()
      this.fileInput = null
    }
    // 清理进度提示元素
    if (this.progressElement) {
      this.progressElement.remove()
      this.progressElement = null
    }
  }

  createProgressElement() {
    this.progressElement = document.createElement('div')
    this.progressElement.className = 'quill-image-progress'
    this.progressElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.9);
      padding: 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      display: none;
    `
    this.progressElement.innerHTML = `
      <div style="text-align: center;">
        <div>图片上传中...</div>
        <div class="progress-text" style="margin-top: 10px;">0%</div>
      </div>
    `
    document.body.appendChild(this.progressElement)
  }

  showProgress(show, progress = 0) {
    if (!this.progressElement) return
    this.progressElement.style.display = show ? 'block' : 'none'
    if (show) {
      this.progressElement.querySelector('.progress-text').textContent = `${Math.round(progress)}%`
    }
  }

  _isEditable() {
    // Quill v2.0 中不再有 isDisabled 方法
    // 只需要检查 readOnly 状态即可
    return !this.quill.options.readOnly
  }

  selectImage() {
    if (!this._isEditable()) {
      return
    }

    // 如果已存在input，先移除
    if (this.fileInput) {
      this.fileInput.remove()
    }

    this.fileInput = document.createElement('input')
    this.fileInput.setAttribute('type', 'file')
    this.fileInput.setAttribute('accept', 'image/*')
    this.fileInput.style.display = 'none'
    document.body.appendChild(this.fileInput)

    this.fileInput.onchange = () => {
      const file = this.fileInput.files[0]
      if (file) {
        this.uploadImage(file)
      }
      // 上传完成后移除input
      this.fileInput.remove()
      this.fileInput = null
    }

    this.fileInput.click()
  }

  async handleDrop(event) {
    if (!this._isEditable()) {
      return
    }

    event.preventDefault()
    if (event.dataTransfer && event.dataTransfer.files) {
      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        await this.uploadImage(file)
      }
    }
  }

  async handlePaste(event) {
    if (!this._isEditable()) {
      return
    }

    const clipboardData = event.clipboardData
    if (clipboardData && clipboardData.items) {
      const items = clipboardData.items
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile()
          await this.uploadImage(file)
          event.preventDefault()
          break
        }
      }
    }
  }

  getFileExtension(file) {
    // 从文件名中获取扩展名
    const fileName = file.name.toLowerCase()
    const ext = fileName.split('.').pop()
    return ext
  }

  validateFile(file) {
    // 检查MIME类型
    if (!Object.keys(this.options.allowedTypes).includes(file.type)) {
      // 获取所有支持的扩展名
      const allowedTypes = Object.values(this.options.allowedTypes).flat()
      throw new Error(`不支持的图片格式，仅支持: ${allowedTypes.join(', ')}`)
    }

    // 检查文件扩展名
    const ext = this.getFileExtension(file)
    const allowedExts = this.options.allowedTypes[file.type]
    if (!allowedExts.includes(ext)) {
      throw new Error(`文件扩展名必须是: ${allowedExts.join(', ')}`)
    }

    // 检查文件大小
    if (file.size > this.options.maxSize) {
      const maxSizeMB = this.options.maxSize / (1024 * 1024)
      throw new Error(`图片大小不能超过 ${maxSizeMB}MB`)
    }
  }

  async uploadImage(file) {
    const range = this.quill.getSelection(true)
    try {
      // 验证文件
      this.validateFile(file)

      // 显示上传进度
      this.showProgress(true, 0)

      // 上传图片
      const formData = new FormData()
      formData.append('file', file)

      const response = await window.axios.post(this.options.uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          this.showProgress(true, percentCompleted)
        },
      })

      // 隐藏进度提示
      this.showProgress(false)

      if (response.data.code === 0) {
        // 插入图片
        const imageUrl = window.location.origin + response.data.data.url
        this.quill.updateContents([{ retain: range.index }, { insert: { image: imageUrl } }, { insert: '\n' }], 'user')

        // 移动光标到图片后
        this.quill.setSelection(range.index + 2, 0)
      } else {
        throw new Error(response.data.msg || '图片上传失败')
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      // 隐藏进度提示
      this.showProgress(false)
      // 恢复光标位置
      this.quill.setSelection(range.index, 0)
      window.showError(error.message)
    }
  }
}
