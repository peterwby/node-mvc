'use strict'

const Database = use('Database')
const log = use('Logger')
const Env = use('Env')
const fs = require('fs').promises
const Helpers = use('Helpers')
const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const Request = require('@Lib/Request')
const Cache = require('@Lib/Cache')
const DictLanguagesTable = require('@Table/dict_languages')
const dictLanguagesTable = new DictLanguagesTable()

class CommonService extends BaseService {
  constructor(props) {
    super(props)
  }

  async refreshCurrentLanguage() {
    try {
      // 避免此时请求不到翻译内容，先加载本地翻译文件作为备用
      try {
        const localTransContent = await fs.readFile(Helpers.appRoot('trans.json'), 'utf8')
        const localTransData = JSON.parse(localTransContent)

        // 将本地翻译数据存入缓存
        Cache.set('translation', localTransData)
      } catch (err) {
        console.error('加载本地翻译文件失败:', err.message)
      }

      console.log('开始刷新翻译')
      //如果手工指定了语言
      const selectedLanguage = Cache.get('selectedLanguage')
      // console.log('selectedLanguage', selectedLanguage)
      let result = await dictLanguagesTable.fetchAll()
      let langList = result.data.data.map((item) => {
        if (selectedLanguage) {
          if (selectedLanguage === item.lang_id) {
            item.is_selected = 1
          }
        } else {
          //默认设置的语言
          if (item.is_default === 1) {
            item.is_selected = 1
          }
        }

        return item
      })

      let currentLangInfo = langList.find((item) => item.is_selected === 1)
      if (!currentLangInfo) {
        throw new Error('No selected or default language found')
      }
      // console.log('currentLangInfo', currentLangInfo)
      const transResponse = await Request.get(currentLangInfo.url)
      if (!transResponse || !transResponse.data) {
        throw new Error('Invalid translation data')
      }
      const transData = transResponse.data

      // 筛选出 node# 开头的翻译
      const filterTransData = {}
      Object.keys(transData).forEach(function (key) {
        if (key.startsWith('node#')) {
          filterTransData[key] = transData[key]
        }
      })
      // console.log('filterTransData', filterTransData)
      // 将翻译数据存储到缓存
      Cache.set('translation', filterTransData)
      console.log('刷新翻译完成')
      return Util.end({})
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_refreshCurrentLanguage_1737460952',
      })
    }
  }

  async getTranslation(ctx) {
    try {
      let result = {}
      const { body } = ctx
      let transObject = Cache.get('translation')
      if (!transObject) {
        console.log('缓存中没有translation，正在刷新翻译数据')
        await this.refreshCurrentLanguage()
        transObject = Cache.get('translation')
        if (!transObject) {
          return Util.end({})
        }
      }
      const data = {
        translation: JSON.stringify(transObject),
      }
      return Util.end({ data })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service_getTranslation_1737515421',
      })
    }
  }

  async uploadImage(ctx) {
    try {
      let result = {}
      const { file } = ctx
      const member_info = ctx.session.get('member')
      const file_name = `editor_${member_info.member_id}_${Date.now()}.${file.subtype}`
      await file.move(Helpers.publicPath('upload/images'), {
        name: file_name,
        overwrite: true,
      })
      if (!file.moved()) {
        throw new Error('upload file failed')
      }
      // console.log(file.subtype, file.type, file.extname, file.fieldName, file.fileName, file.clientName)
      const data = {
        url: `/upload/images/${file_name}`,
      }
      return Util.end({ data })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'service__1737270120',
      })
    }
  }
}

module.exports = CommonService
