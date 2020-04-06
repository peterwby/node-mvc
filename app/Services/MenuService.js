'use strict'

const BaseService = require('@BaseClass/BaseService')
const Util = require('@Lib/Util')
const log = use('Logger')

class MenuService extends BaseService {
  /**
   * 获取主菜单内容
   */
  async getPrimaryMenu(ctx) {
    try {
      //读取菜单内容
      let result = {}
      const MenuTable = require('@Table/menu')
      const menuTable = new MenuTable()
      result = await menuTable.fetchAll({
        column: ['*'],
        where: [['status_id', '=', '1']],
        orderBy: [
          ['number', 'asc'],
          ['step', 'asc'],
        ],
      })

      //组装菜单
      const menuData = buildPrimaryMenu(result.data.data)
      //按权限显示菜单
      let finalData = []
      for (let i = 0; i < menuData.length; i++) {
        //if(data[i].title=='公司' && !result.hasProject){
        //    continue
        //}
        finalData.push(menuData[i])
      }
      return Util.end({
        data: finalData,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        track: 'getmenujh2lwejf',
      })
    }
  }
}

/**
 * 数据库的返回结果组装成指定的菜单格式
 */
function buildPrimaryMenu(menuData) {
  try {
    let data = []
    let data1 = []
    let data2 = []
    let data3 = []
    for (let item of menuData) {
      let title = item.title || ''
      let icon = item.icon || ''
      let name = item.name || ''
      let jump = item.jump || ''
      let spread = item.spread
      let number = item.number
      let is_detail = item.is_detail
      let menuClass = number.split('.').length - 1
      if (menuClass == 0) {
        //一级菜单
        data1.push({
          title: title,
          icon: icon,
          name: name,
          jump: jump,
          spread: spread,
          number: number,
          is_detail: is_detail,
        })
      } else if (menuClass == 1) {
        data2.push({
          title: title,
          icon: icon,
          name: name,
          jump: jump,
          spread: spread,
          number: number,
          is_detail: is_detail,
        })
      } else if (menuClass == 2) {
        data3.push({
          title: title,
          icon: icon,
          name: name,
          jump: jump,
          spread: spread,
          number: number,
          is_detail: is_detail,
        })
      }
    }
    let str = '['
    for (let item1 of data1) {
      str += `{"title": "${item1.title}","icon": "${item1.icon}",`
      if (!item1.name && !item1.jump) {
        //不是明细菜单
        str += `"list": [`
        for (let item2 of data2) {
          if (item1.number + '.' == item2.number.substring(0, Util.strIndexOfMulti(item2.number, '.', 1) + 1)) {
            str += `{"title": "${item2.title}","icon": "${item2.icon}",`
            if (!item2.name && !item2.jump) {
              //不是明细菜单
              str += `"list": [`
              for (let item3 of data3) {
                if (item2.number + '.' == item3.number.substring(0, Util.strIndexOfMulti(item3.number, '.', 2) + 1)) {
                  str += `{"title": "${item3.title}","icon": "${item3.icon}",`
                  //明细菜单
                  if (item3.name) {
                    str += `"name": "${item3.name}", `
                  }
                  if (item3.jump) {
                    str += `"jump": "${item3.jump}", `
                  }
                  if (item3.spread == 0) {
                    str += `"spread": false, `
                  } else {
                    str += `"spread": true, `
                  }
                  str += `},`
                }
              }
              str += `],`
            } else {
              //明细菜单
              if (item2.name) {
                str += `"name": "${item2.name}", `
              }
              if (item2.jump) {
                str += `"jump": "${item2.jump}", `
              }
            }
            if (item2.spread == 0) {
              str += `"spread": false, `
            } else {
              str += `"spread": true, `
            }
            str += `},`
          }
        }
        str += `],`
      } else {
        //明细菜单
        if (item1.name) {
          str += `"name": "${item1.name}", `
        }
        if (item1.jump) {
          str += `"jump": "${item1.jump}", `
        }
      }
      if (item1.spread == 0) {
        str += `"spread": false, `
      } else {
        str += `"spread": true, `
      }
      str += `},`
    }
    str += `]`

    data = eval(str)
    return data
  } catch (err) {
    throw new Error(`429th3iowe:${err.message}`)
  }
}

module.exports = MenuService
