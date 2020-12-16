'use strict'

const jimp = require('jimp')
// const fs = require('fs')
// const util = require('util')
// const writeFile = util.promisify(fs.writeFile)
// const readFile = util.promisify(fs.readFile)

const ImageUtil = {
  /**
   * @brief 图片处理
   * @example
   * @params
   *    data: 图片的buffer
   *    options:
   *      width: 图片宽度
   *      height: 图片高度
   *      print_text: {x,y,message}
   *      quality: 质量
   */
  handle: async (data, options) => {
    let buffer = null
    if (data.Body != undefined) {
      buffer = data.Body
    } else if (data != undefined) {
      buffer = data
    } else {
      return buffer
    }
    options = options || {}
    // 读取图片
    const image = await jimp.read(buffer)
    const mime = image.getMIME()
    // 图片缩放
    if (options.width && options.heigth) {
      // 指定了宽度和高度
      image.resize(options.width, options.heigth)
    } else if (options.width) {
      // 只指定了宽度
      image.resize(options.width, jimp.AUTO)
    } else if (options.heigth) {
      // 只指定了高度
      image.resize(jimp.AUTO, options.heigth)
    }
    // 书写文字
    if (options.print_text && options.print_text.message) {
      const printText = options.print_text || {}
      const font = await jimp.loadFont('resources/fonts/font1/ziti.fnt')
      image.print(font, printText.x || 10, printText.y || 10, printText.message)
    }
    // 图片压缩
    if (options.quality) {
      image.quality(options.quality)
    }
    // 返回图片的buffer
    return await image.getBufferAsync(mime)
  },
}
/*
const test = async () => {
  let buffer = await readFile('tmp/timg.jpg')
  buffer = await ImageUtil.handle(buffer, {
    width: 400,
    print_text: {x: 50, y: 100, message: '你好呀，世界!'},
    quality: 50
  })
  await writeFile('tmp/dd7.jpg', buffer)
}
test()*/

module.exports = ImageUtil
