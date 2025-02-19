/**
 * 基于Metronic Tailwind modal组件的消息弹窗类
 */
class MessageModal {
  /**
   * 创建一个新的消息弹窗实例
   * @param {Object} options 配置选项
   * @param {string} options.title 弹窗标题
   * @param {string} options.content 弹窗内容
   * @param {boolean} [options.persistent=false] 是否阻止点击外部关闭
   * @param {Object} [options.buttons] 按钮配置
   * @param {Object} [options.buttons.confirm] 确认按钮配置
   * @param {string} [options.buttons.confirm.text='确定'] 确认按钮文本
   * @param {string} [options.buttons.confirm.class='btn btn-primary'] 确认按钮样式类
   * @param {Object} [options.buttons.cancel] 取消按钮配置
   * @param {string} [options.buttons.cancel.text='取消'] 取消按钮文本
   * @param {string} [options.buttons.cancel.class='btn btn-light'] 取消按钮样式类
   */
  constructor(options = {}) {
    this.options = {
      title: options.title || '',
      content: options.content || '',
      persistent: options.persistent || false,
      buttons: {
        confirm: {
          text: options.buttons?.confirm?.text || window.Tools.trans('confirm'),
          class: options.buttons?.confirm?.class || 'btn btn-primary',
        },
        cancel: options.buttons?.cancel
          ? {
              text: options.buttons.cancel.text || window.Tools.trans('cancel'),
              class: options.buttons.cancel.class || 'btn btn-light',
            }
          : null,
      },
    }

    this.modal = null
    this.modalElement = null
    this._createModal()
  }

  /**
   * 创建modal DOM元素
   * @private
   */
  _createModal() {
    // 创建modal容器
    this.modalElement = document.createElement('div')
    this.modalElement.setAttribute('id', 'kt_modal_' + Date.now())
    this.modalElement.setAttribute('data-modal', 'false') // 防止自动初始化
    this.modalElement.className = 'modal'

    // 构建modal HTML结构
    const closeButton = !this.options.persistent
      ? '<button class="btn btn-xs btn-icon btn-light" data-modal-dismiss="true"><i class="ki-outline ki-cross"></i></button>'
      : ''

    const cancelButton = this.options.buttons.cancel
      ? '<button type="button" class="' +
        this._escapeHtml(this.options.buttons.cancel.class) +
        '" data-modal-dismiss="true">' +
        this._escapeHtml(this.options.buttons.cancel.text) +
        '</button>'
      : ''

    const modalHtml =
      '<div class="modal-content max-w-[400px] top-[20%]">' +
      '<div class="modal-header">' +
      '<h3 class="modal-title">' +
      this._escapeHtml(this.options.title) +
      '</h3>' +
      closeButton +
      '</div>' +
      '<div class="modal-body min-h-[80px] content-center">' +
      this._escapeHtml(this.options.content) +
      '</div>' +
      '<div class="modal-footer justify-end">' +
      '<div class="flex gap-4">' +
      cancelButton +
      '<button type="button" class="' +
      this._escapeHtml(this.options.buttons.confirm.class) +
      '" id="' +
      this.modalElement.id +
      '_confirm">' +
      this._escapeHtml(this.options.buttons.confirm.text) +
      '</button>' +
      '</div>' +
      '</div>' +
      '</div>'

    this.modalElement.innerHTML = modalHtml
    document.body.appendChild(this.modalElement)

    // 初始化Metronic modal，使用标准配置选项
    this.modal = new KTModal(this.modalElement, {
      backdrop: true, // 是否显示背景遮罩
      backdropStatic: this.options.persistent, // 点击背景是否关闭
      keyboard: !this.options.persistent, // 是否允许按ESC键关闭
      disableScroll: true, // 是否禁用页面滚动
    })

    // 绑定事件
    this.modal.on('hidden', () => {
      if (this.options.buttons.cancel && typeof this._onCancel === 'function') {
        this._onCancel()
      }
      this.destroy()
    })

    // 绑定确认按钮事件
    const confirmBtn = document.getElementById(this.modalElement.id + '_confirm')
    confirmBtn.addEventListener('click', () => {
      if (typeof this._onConfirm === 'function') {
        this._onConfirm()
      }
      this.hide()
    })
  }

  /**
   * HTML转义，防止XSS攻击
   * @private
   */
  _escapeHtml(unsafe) {
    if (!unsafe) return ''
    return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
  }

  /**
   * 显示弹窗
   * @returns {MessageModal} 返回实例本身，支持链式调用
   */
  show() {
    this.modal.show()
    return this
  }

  /**
   * 隐藏弹窗
   * @returns {MessageModal} 返回实例本身，支持链式调用
   */
  hide() {
    this.modal.hide()
    return this
  }

  /**
   * 设置确认按钮回调
   * @param {Function} callback 回调函数
   * @returns {MessageModal} 返回实例本身，支持链式调用
   */
  onConfirm(callback) {
    this._onConfirm = callback
    return this
  }

  /**
   * 设置取消按钮回调
   * @param {Function} callback 回调函数
   * @returns {MessageModal} 返回实例本身，支持链式调用
   */
  onCancel(callback) {
    this._onCancel = callback
    return this
  }

  /**
   * 销毁弹窗实例
   */
  destroy() {
    if (this.modal) {
      this.modal.dispose()
    }
    if (this.modalElement && this.modalElement.parentNode) {
      this.modalElement.parentNode.removeChild(this.modalElement)
    }
    this.modal = null
    this.modalElement = null
  }
}

// 添加到全局作用域
window.MessageModal = MessageModal

// 快捷方法
window.showConfirm = function (content, options = {}) {
  return new Promise((resolve) => {
    const modal = new MessageModal({
      title: options.title || window.Tools.trans('info'),
      content,
      persistent: options.persistent === undefined || options.persistent === null ? true : options.persistent,
      buttons: {
        confirm: {
          text: options.confirmText || window.Tools.trans('confirm'),
          class: options.confirmClass || 'btn btn-primary',
        },
        cancel: {
          text: options.cancelText || window.Tools.trans('cancel'),
          class: options.cancelClass || 'btn btn-light',
        },
      },
    })

    // 确认按钮回调
    modal.onConfirm(() => {
      if (options.onConfirm) options.onConfirm()
      resolve(true)
    })

    // 取消按钮回调
    modal.onCancel(() => {
      if (options.onCancel) options.onCancel()
      resolve(false)
    })

    modal.show()
  })
}

window.showSuccess = function (content, options = {}) {
  const modal = new MessageModal({
    title: options.title || window.Tools.trans('info'),
    content,
    persistent: options.persistent === undefined || options.persistent === null ? false : options.persistent,
    buttons: {
      confirm: {
        text: options.confirmText || window.Tools.trans('confirm'),
        class: options.confirmClass || 'btn btn-primary',
      },
    },
  })

  if (options.onConfirm) modal.onConfirm(options.onConfirm)

  // 自动关闭功能
  const autoCloseDelay = options.autoClose === undefined ? 3000 : options.autoClose
  let autoCloseTimer = null

  if (autoCloseDelay !== false) {
    autoCloseTimer = setTimeout(() => {
      const confirmBtn = document.getElementById(modal.modalElement.id + '_confirm')
      if (confirmBtn) {
        confirmBtn.click()
      }
    }, autoCloseDelay)

    // 如果用户手动点击了按钮，清除定时器
    modal.onConfirm(() => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer)
        autoCloseTimer = null
      }
      if (options.onConfirm) options.onConfirm()
    })
  }

  modal.show()
  return modal
}

window.showError = function (content, options = {}) {
  const modal = new MessageModal({
    title: options.title || window.Tools.trans('error'),
    content,
    persistent: options.persistent === undefined || options.persistent === null ? false : options.persistent,
    buttons: {
      confirm: {
        text: options.confirmText || window.Tools.trans('confirm'),
        class: options.confirmClass || 'btn btn-danger',
      },
    },
  })

  if (options.onConfirm) modal.onConfirm(options.onConfirm)

  modal.show()
  return modal
}
