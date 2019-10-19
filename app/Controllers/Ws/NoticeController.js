'use strict'

class NoticeController {
  constructor({ socket, request }) {
    this.socket = socket
    this.request = request
  }

  onMessage(message) {
    this.socket.broadcastToAll('message', message)
  }

  onClose() {
    console.log('ws服务器上onClose')
  }

  onError() {
    console.log('ws服务器上onError')
  }
}

module.exports = NoticeController
