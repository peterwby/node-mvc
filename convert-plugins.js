const fs = require('fs')
const path = require('path')

const pluginsDir = path.join(__dirname, 'resources/metronic/core/plugins')

function convertFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')

  // 替换 import 语句
  let newContent = content.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, "const $1 = require('$2')")

  // 替换 export default
  newContent = newContent.replace(/export\s+default/g, 'module.exports =')

  fs.writeFileSync(filePath, newContent)
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      processDirectory(filePath)
    } else if (file.endsWith('.js')) {
      console.log(`Converting ${filePath}`)
      convertFile(filePath)
    }
  })
}

processDirectory(pluginsDir)
