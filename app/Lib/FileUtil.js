/**
 * File Util
 */

const log = use('Logger')
const fs = use('fs')
const util = use('util')
const unzips = use('unzip-stream')
const nodePath = use('path')
const JSZIP = require('jszip')
const copyFile = util.promisify(fs.copyFile)
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const exists = util.promisify(fs.exists)
const readdir = util.promisify(fs.readdir)
const unlink = util.promisify(fs.unlink)
const lstat = util.promisify(fs.lstat)
const rmdir = util.promisify(fs.rmdir)
const mkdir = util.promisify(fs.mkdir)
const appendFile = util.promisify(fs.appendFile)

const FileUtil = {
  exists,
  copyFile,
  appendFile,
  /**
   * Delete the file and dir by path with recursion
   * @returns boolean
   */
  deleteFileAndDirByPath: async function (path) {
    try {
      const isPathExists = await exists(path)
      if (isPathExists) {
        const files = await readdir(path)
        for (let i = 0; i < files.length; i++) {
          const curPath = `${path}/${files[i]}`
          const fileStats = await lstat(curPath)
          if (fileStats.isDirectory()) {
            // recurse
            await this.deleteFileAndDirByPath(curPath)
          } else {
            // delete file
            await unlink(curPath)
          }
        }
        await rmdir(path)
        return true
      }
    } catch (err) {
      log.error(`Delete path: ${path} failed with ${err.message}`)
      return false
    }
    return true
  },

  /**
   * Delete the single folder or file by path
   * @returns boolean
   */
  deleteFolderOrFile: async function (path) {
    try {
      const isPathExists = await exists(path)
      if (isPathExists) {
        const fileStats = await lstat(path)
        if (fileStats.isDirectory()) {
          await rmdir(path)
        } else {
          // delete file
          await unlink(path)
        }
      }
      return true
    } catch (err) {
      log.error(`Delete file failed with path: ${path}, error: ${err.message}`)
      return false
    }
  },

  /**
   * Read folder and return the files' path of folder
   */
  readFilesPathFromFolder: async function (path) {
    let filePaths = []
    try {
      const isFolderExists = await exists(path)
      if (!isFolderExists) {
        return null
      }

      const subPaths = await readdir(path)
      for (let subPath of subPaths) {
        // ignore the mac hidden folder
        if (subPath === '__MACOSX' || subPath === '.DS_Store') {
          continue
        }
        const currentPath = `${path}/${subPath}`
        const fileStats = await lstat(currentPath)
        if (fileStats.isDirectory()) {
          const nextFilesPaths = await this.readFilesPathFromFolder(currentPath)
          if (nextFilesPaths) {
            filePaths = filePaths.concat(nextFilesPaths)
          }
        } else {
          filePaths.push(currentPath)
        }
      }
      return filePaths
    } catch (err) {
      log.error(`Read file path error with: ${err.message}`)
      return null
    }
  },

  /**
   * unzip file to specified path
   * @example
   * await FileUtil.unzipFile(压缩文件路径, 待解压文件路径)
   */
  unzipFile: function (zipFilePath, unzipPath) {
    return new Promise((resolve, reject) => {
      const unzipStream = unzips.Extract({ path: unzipPath })
      fs.createReadStream(zipFilePath).pipe(unzipStream)
      unzipStream.on('error', function (err) {
        return reject(err)
      })
      unzipStream.on('close', function () {
        return resolve()
      })
    })
  },

  /**
   * zip file or folder
   * @example
   * await FileUtil.zipFile(待压缩目录路径, 压缩文件路径)
   */
  zipFile: function (filePath, zipFilePath, folderName) {
    //读取目录及文件
    function readDir(obj, nowPath) {
      let files = fs.readdirSync(nowPath) //读取目录中的所有文件及文件夹（同步操作）
      files.forEach(function (fileName, index) {
        //遍历检测目录中的文件
        let currentFilePath = nowPath + '/' + fileName
        let file = fs.statSync(currentFilePath) //获取一个文件的属性
        if (file.isDirectory()) {
          //如果是目录的话，继续查询
          let dirlist = obj.folder(fileName) //压缩对象中生成该目录
          readDir(dirlist, currentFilePath) //重新检索目录文件
        } else {
          obj.file(fileName, fs.readFileSync(currentFilePath)) //压缩目录添加文件
        }
      })
    }
    return new Promise((resolve, reject) => {
      const zip = new JSZIP()
      readDir(zip, filePath)
      zip
        .generateNodeStream({ streamFiles: true })
        .pipe(fs.createWriteStream(zipFilePath))
        .on('finish', function () {
          return resolve(true)
        })
        .on('error', function (err) {
          return reject(err)
        })
    })
  },

  /**
   * Prepare the file path
   * @param  {String} path     The file path
   * @returns {Boolean} result
   */
  checkAndPrepareFilePath: async function (path) {
    const isPathExists = await exists(path)
    if (isPathExists) {
      return true
    }
    const isPrepared = await this.checkAndPrepareFilePath(nodePath.dirname(path))
    if (isPrepared) {
      try {
        await mkdir(path)
        return true
      } catch (err) {
        log.error(`The path: ${path} prepare failed with ${err.message}`)
      }
    }
    return false
  },

  writeFile: async function (path, content) {
    try {
      await writeFile(path, content)
      return true
    } catch (err) {
      log.error(`Write file failed with path: ${path}, error: ${err.message}`)
      return false
    }
  },

  readFile: async function (path) {
    try {
      const content = await readFile(path)
      return content
    } catch (err) {
      log.error(`Read file failed with path: ${path}, error: ${err.message}`)
      return null
    }
  },

  // copyFile: async function (source, target) {
  //   var rd = fs.createReadStream(source)
  //   var wr = fs.createWriteStream(target)
  //   try {
  //     return await new Promise(function (resolve, reject) {
  //       rd.on('error', reject)
  //       wr.on('error', reject)
  //       wr.on('finish', resolve(true))
  //       rd.pipe(wr)
  //     })
  //   } catch (err) {
  //     rd.destroy()
  //     wr.end()
  //     log.error(`copy file from ${source} to ${target} failed with ${err.message}`)
  //     return false
  //   }
  // },
}

module.exports = FileUtil
