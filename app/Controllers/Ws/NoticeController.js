'use strict'

class NoticeController {
  constructor({ socket, request }) {
    this.socket = socket
    this.request = request
  }

  onMessage(message) {
    console.log('received message ', message)
    // this.socket.broadcastToAll('message', message)
  }

  onClose() {
    console.log('ws服务器上onClose')
  }

  onError() {
    console.log('ws服务器上onError')
  }
}

module.exports = NoticeController
