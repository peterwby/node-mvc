/****************************************************************************
名称：常用工具函数集合
日期：2019年10月22日
****************************************************************************/

const log = use('Logger')

const Util = {
  /************************************************************************
   * 业务
   ************************************************************************/
  /**
   * 操作成功
   *
   * success({msg:'', data:{}})
   */
  success: obj => {
    //不是object
    if (Object.prototype.toString.call(obj) !== '[object Object]') {
      //返回一个缺省值
      return {
        fail: false,
        msg: 'success',
      }
    }
    obj.fail = false
    obj.msg = obj.msg || 'success'
    obj.data = obj.data || {}
    return obj
  },

  /**
   * 操作失败
   *
   * error({msg:'', track:'随机值'})
   */
  error: obj => {
    //不是object
    if (Object.prototype.toString.call(obj) !== '[object Object]') {
      log.notice('error')
      //返回一个缺省值
      return {
        fail: true,
        msg: 'error',
        track: '',
      }
    }
    obj.fail = true
    obj.msg = obj.msg || 'error'
    obj.data = obj.data || {}
    obj.track = obj.track || ''

    log.notice(obj.track)
    if (JSON.stringify(obj.data) !== '{}') {
      log.error(obj.data)
    }
    log.error(obj.msg)
    return obj
  },

  /**
   * 发给前端的成功信息
   *
   * success2front({msg:'', data:{}, code: 0})
   */
  success2front: obj => {
    //不是object
    if (Object.prototype.toString.call(obj) !== '[object Object]') {
      //返回一个缺省值
      return {
        fail: false,
        msg: '操作成功',
        data: {},
        code: 0,
      }
    }
    obj.fail = false
    obj.msg = obj.msg || '操作成功'
    obj.data = obj.data || {}
    obj.code = obj.code || 0
    return obj
  },

  /**
   * 发给前端的失败信息
   *
   * error2front({msg:'', code: 9999, track:'随机值'})
   */
  error2front: obj => {
    //不是object
    if (Object.prototype.toString.call(obj) !== '[object Object]') {
      log.notice('出现错误')
      //返回一个缺省值
      return {
        fail: true,
        msg: '出现错误',
        data: {},
        code: 9999,
        track: '',
      }
    }
    log.notice(obj.track)
    log.error(obj.msg)

    obj.fail = true
    obj.msg = '出现错误'
    obj.data = obj.data || {}
    obj.code = obj.code || 9999
    obj.track = obj.track || ''

    if (JSON.stringify(obj.data) !== '{}') {
      log.error(obj.data)
    }

    return obj
  },

  /**
   * 对象里只保留期望的键
   *
   * filterKey({name:''}, {name:'xx', aa:1 }) : {name: 'xx'}
   */
  filterKey: (expectObj, rawObj) => {
    for (let k in rawObj) {
      if (expectObj.hasOwnProperty(k)) {
        expectObj[k] = rawObj[k]
      }
    }
    return expectObj
  },

  /************************************************************************
   * Arrays
   ************************************************************************/

  /*
        数组深拷贝
        var arr = [1,2,3,4,5]
        var [ ...arr2 ] = arr
        ------------------------------------
        对象的深拷贝
        var obj = {
            name: 'FungLeo',
            sex: 'man',
        }
        var { ...obj2 } = obj
    */

  /**
   * 返回数组中的最大值
   * arrMax([1,2,3]): 3
   */
  arrMax: arr => Math.max(...arr),

  /**
   * 返回数组中的最小值
   *  arrMin([1,2,3]): 1
   */
  arrMin: arr => Math.min(...arr),

  /**
   * 将数组块平均拆分为指定大小的较小数组，返回一个二维数组。
   * arrSplit([1,2,3,4,5],2): [[1,2],[3,4],[5]]
   */
  arrSplit: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size)),

  /**
   * 计算数组中某个元素值的出现次数
   * arrItemCount(['a', 'a', 'b'], 'a'): 2
   */
  arrItemCount: (arr, value) => arr.reduce((a, v) => (v === value ? a + 1 : a + 0), 0),

  /**
   * 返回去重后的数组
   * arrRemoveDuplicate([1,2,2,3]): [1,2,3]
   */
  arrRemoveDuplicate: arr => [...new Set(arr)],

  /**
   * 返回两个数组中相同的元素（注：不去重，大小写敏感）
   * arrRemoveDuplicateDoubleCase([1,2],[2,3]): [2]
   */
  arrRemoveDuplicateDoubleCase: (a, b) => {
    const s = new Set(b)
    return a.filter(x => s.has(x))
  },

  /**
   * 返回两个数组中相同的元素（注：不去重，大小写不敏感）
   * arrRemoveDuplicateDouble(['A','b','C'], ['c']): ['c']
   */
  arrRemoveDuplicateDouble: (a, b) => {
    let a1 = [],
      b1 = []
    for (let i of b) {
      b1.push(i.toLowerCase())
    }
    for (let i of a) {
      a1.push(i.toLowerCase())
    }
    const s = new Set(b1)
    return a1.filter(x => s.has(x))
  },

  /**
   * 删除2个数组同时存在的元素，返回一个合并后的新数组
   * arrDeleteDoubleAndUnion([1,2],[2,3]): [1,3]
   */
  arrDeleteDoubleAndUnion: (a, b) => {
    const sA = new Set(a),
      sB = new Set(b)
    return [...a.filter(x => !sB.has(x)), ...b.filter(x => !sA.has(x))]
  },

  /**
   * 从A数组中删除AB数组同时存在的元素，返回一个新数组
   * arrDeleteDouble([1,2],[2,3]): [1]
   */
  arrDeleteDouble: (a, b) => {
    const s = new Set(b)
    return a.filter(x => !s.has(x))
  },

  /**
   * 2数组先去重，返回一个合并后的新数组
   * arrUnionDouble([1,2],[2,3]): [1,2,3]
   */
  arrUnionDouble: (a, b) => Array.from(new Set([...a, ...b])),

  /**
   * 返回数组中的所有元素, 除第一个
   * arrNotFirst([1,2,3]): [2,3]
   */
  arrNotFirst: arr => (arr.length > 1 ? arr.slice(1) : arr),

  /**
   * 返回数组中的所有元素, 除最后一个
   * arrNotLast([1,2,3]): [1,2]
   */
  arrNotLast: arr => arr.slice(0, -1),

  /**
   * 返回从右边开始数，第n个元素位置的数组
   * arrSliceLast([1,2,3],2): [2,3]
   */
  arrSliceLast: (arr, n = 1) => arr.slice(arr.length - n, arr.length),

  /**
   * 删除指定元素值（可多个），返回一个新数组
   * arrDelete([1,2,3,4,5],3,5): [1,2,4]
   */
  arrDelete: (arr, ...args) => arr.filter(v => !args.includes(v)),

  /**
   * 删除指定元素值，返回原数组，原数组改变
   * arrDeleteRaw([1,2,3,4,5],3): [1,2,4,5]
   */
  arrDeleteRaw: function(arr, val) {
    var i = 0
    while (i < arr.length) {
      if (arr[i] == val) {
        arr.splice(i, 1)
      } else {
        i++
      }
    }
    return arr
  },

  /**
   * 检查给定数组中是否包含某值（大小写敏感）
   * arrIncludesCase([1,2],3): false
   */
  arrIncludesCase: function(arr, val) {
    var i = arr.length
    while (i--) {
      if (arr[i] === val) {
        return true
      }
    }
    return false
  },

  /**
   * 检查给定数组中是否包含某值（大小写不敏感）
   * arrIncludes([1,2],3): false
   */
  arrIncludes: function(arr, val) {
    var i = arr.length
    while (i--) {
      if (arr[i].toLowerCase() == val.toLowerCase()) {
        return true
      }
    }
    return false
  },

  /**
   * 把数组里的所有元素转成小写
   */
  arr2LowerCase: function(arr) {
    if (!arr) {
      return []
    }
    let arr2 = []
    for (let item of arr) {
      arr2.push(item.toLowerCase())
    }
    return arr2
  },

  /**
   * 随机返回数组中的一个元素值
   * arrRandomValue([1,2,3]): 1、2、3里的随机一个值
   */
  arrRandomValue: arr => arr[Math.floor(Math.random() * arr.length)],

  /**
   * 返回一个打乱了顺序的数组
   * arrRandomSort([1,2,3]): 可能返回[2,1,3]
   */
  arrRandomSort: arr => arr.sort(() => Math.random() - 0.5),

  /**
   * 返回数组中每间隔n个的那些元素组成的数组
   * arrEveryNth([1,2,3,4,5,6,7,8,9,10],3): [1, 4, 7, 10]
   */
  arrEveryNth: (arr, nth) => arr.filter((e, i) => i % nth === 0),

  /**
   * 返回数字数组的平均值(浮点数)
   */
  arrAvg: arr => arr.reduce((acc, val) => acc + val, 0) / arr.length,

  /**
   * 返回一个数字数组的总和
   */
  arrSum: arr => arr.reduce((acc, val) => acc + val, 0),

  /**
   * 返回算给定数组中有多少个数小于或等于给定值的百分比
   * arrPercentile([1,2,3,4],3): 62.5
   */
  arrPercentIle: (arr, val) => (100 * arr.reduce((acc, v) => acc + (v < val ? 1 : 0) + (v === val ? 0.5 : 0), 0)) / arr.length,

  /************************************************************************
   * 日期类
   ************************************************************************/
  /**
   * 把秒数换算成天、时、分、秒的json
   * @param {*} value
   */
  number2timeJson: function(value) {
    var theTime = parseInt(value) // 秒
    var theTime1 = 0 // 分
    var theTime2 = 0 // 小时
    var theTime3 = 0 //天
    if (theTime > 60) {
      theTime1 = parseInt(theTime / 60)
      theTime = parseInt(theTime % 60)
      if (theTime1 > 60) {
        theTime2 = parseInt(theTime1 / 60)
        theTime1 = parseInt(theTime1 % 60)
        if (theTime2 > 24) {
          theTime3 = parseInt(theTime2 / 24)
          theTime2 = parseInt(theTime2 % 24)
        }
      }
    }

    var result = {}
    result.second = theTime ? parseInt(theTime) : 0
    result.minute = theTime1 ? parseInt(theTime1) : 0
    result.hour = theTime2 ? parseInt(theTime2) : 0
    result.day = theTime3 ? parseInt(theTime3) : 0
    return result
  },
  /**
     格式化日期
     moment().format("YYYY-MM-DD HH:mm:ss")
      
     是否是合法日期
     moment('2019-13-02').isValid()

     日期减去10分钟
     moment('2019-01-01 00:00:00').subtract(10, "minutes")
     
     日期加上10个月
     moment('2019-01-01 00:00:00').add(10, "months").format("YYYY-MM-DD HH:mm:ss")
     
     2个日期相差多少间隔 a.diff(b, 'days')  ==  a - b
     moment('2019-01-01 00:00:00').diff(moment('2019-01-01 01:00:00'),'minutes') = -60;
    
     日期转时间戳
     moment('2019-06-12 12:30:10').valueOf()//毫秒
     moment('2019-06-12 12:30:10').unix()//秒
     
     时间戳(毫秒）转日期
     moment(1560313810687).format('YYYY-MM-DD HH:mm:ss')
     
     获取当月的天数
     moment().daysInMonth()
     moment("2012-02", "YYYY-MM").daysInMonth() // 29
     
     转换
     moment().toArray()
     moment().toObject()
     
     比较
     moment('2010-10-20').isSame('2010-01-01', 'year');  // true
     moment('2010-10-20').isBefore('2010-12-31', 'year'); // false
     moment('2010-10-20').isAfter('2009-12-31', 'year'); // true
     moment('2010-10-20').isBetween('2009-12-31', '2012-01-01', 'year'); // true
     
     是否闰年
     moment().isLeapYear();
     moment([2001]).isLeapYear()

    */
  dateHelp: () => {},

  /************************************************************************
   * 函数类
   ************************************************************************/
  /**
   * await sleep(1000)
   */
  sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),

  /**
     * 避免调用await函数是大量使用try{func()}catch(e){}结构，用to函数使得页面整洁
     * [err, result] = await to(func());
       if (err) {
         return console.log(err)
       }
     */
  to: promise => {
    if (!promise || !Promise.prototype.isPrototypeOf(promise)) {
      return new Promise((resolve, reject) => {
        reject(new Error('to要求参数是promise类型'))
      }).catch(err => {
        return [err, null]
      })
    }
    return promise
      .then(function() {
        return [null, ...arguments]
      })
      .catch(err => {
        return [err, null]
      })
  },

  /**
   * 在控制台打印函数执行时间，并返回函数结果
   * function aa(){}
   * let result = funcTime(aa): xxxx ms
   */
  funcTime: callback => {
    console.time('耗费时间')
    const r = callback()
    console.timeEnd('耗费时间')
    return r
  },

  /************************************************************************
   * Math 数学类
   ************************************************************************/

  /**
   * 将数字四舍五入到指定的位数
   */
  mathRound: (n, decimals = 0) => Number(`${Math.round(`${n}e${decimals}`)}e-${decimals}`),

  /**
   * 两个参数之间的随机整数
   * mathRandomDuration(5,7): 5 <= x <= 7
   */
  mathRandomInt: (lowerValue, upperValue) => {
    var chioces = upperValue - lowerValue + 1
    return Math.floor(Math.random() * chioces + lowerValue)
  },

  /**
   * 两个参数之间的随机浮点数
   * mathRandomDuration(5,7): 5 <= x <= 7
   */
  mathRandomFloat: (min, max) => Math.random() * (max - min) + min,

  /**
   * 返回从0开始的斐波那契数列的长度为n的数组
   * mathFibonacci(5): [0, 1, 1, 2, 3]
   */
  mathFibonacci: n =>
    Array(n)
      .fill(0)
      .reduce((acc, val, i) => acc.concat(i > 1 ? acc[i - 1] + acc[i - 2] : i), []),

  // isDivisible: 检查第一个数值参数是否可被另一个数字变量整除
  // 使用模数运算符 (%) 检查余数是否等于0
  isDivisible: (dividend, divisor) => dividend % divisor === 0,

  // isEven: 如果给定的数字为偶数, 则返回true, 否则为false
  isEven: num => num % 2 === 0,

  /**
   * 计算最大公约数
   */
  mathGCD: (a, b) => {
    let x = a,
      y = b
    _gcd = (_x, _y) => (!_y ? _x : _gcd(_y, _x % _y))
    return _gcd(a, b)
  },

  /**
   * 计算最小公倍数
   */
  mathLCM: (x, y) => {
    const gcd = (x, y) => (!y ? x : gcd(y, x % y))
    return Math.abs(x * y) / gcd(x, y)
  },

  /************************************************************************
   * 对象类
   ************************************************************************/

  /**
   * 是否有某个属性/键（大小写敏感）
   * jsonHas({aa:1}, 'aa'): true
   */
  jsonHas: function(obj, key) {
    return obj.hasOwnProperty(key)
  },

  /**
   * 字符串：驼峰转为连字符
   */
  str2Line: hump => hump.replace(/([A-Z]|\d)/g, (a, l) => `_${l.toLowerCase()}`),
  /**
   * 字符串：连字符转为驼峰
   */
  str2Camel: name =>
    name.replace(/\_(\w)/g, function(all, letter) {
      return letter.toUpperCase()
    }),

  /**
   * 驼峰转为连字符
   */
  toLine: data => {
    let newData = null
    if (Util.isObj(data)) {
      newData = {}
      for (let key in data) {
        newData[Util.str2Line(key)] = data[key]
      }
    } else if (Util.isArray(data)) {
      if (Util.isString(data[0])) {
        newData = []
        for (let key of data) {
          newData.push(Util.str2Line(key))
        }
      } else if (Util.isObj(data[0])) {
        newData = []
        for (let a of data) {
          let newObj = {}
          for (let k in a) {
            newObj[Util.str2Line(k)] = a[k]
          }
          newData.push(newObj)
        }
      } else {
        newData = data
      }
    } else {
      newData = data
    }

    return newData
  },

  /**
   * 连字符转为驼峰
   */
  toCamel: data => {
    let newData = null
    if (Util.isObj(data)) {
      newData = {}
      for (let key in data) {
        newData[Util.str2Camel(key)] = data[key]
      }
    } else if (Util.isArray(data)) {
      if (Util.isString(data[0])) {
        newData = []
        for (let key of data) {
          newData.push(Util.str2Camel(key))
        }
      } else if (Util.isObj(data[0])) {
        newData = []
        for (let a of data) {
          let newObj = {}
          for (let k in a) {
            newObj[Util.str2Camel(k)] = a[k]
          }
          newData.push(newObj)
        }
      } else {
        newData = data
      }
    } else {
      newData = data
    }

    return newData
  },

  /************************************************************************
   * 字符串类
   ************************************************************************/

  /**
   * 返回字符串第n次出现的下标位置
   * strIndexOfMulti('00ab00ab', 'ab', 2)： 6
   * @param {字符串} str
   * @param {待查找} cha
   * @param {第n次出现} num
   */
  strIndexOfMulti: function(str, cha, num) {
    var x = str.indexOf(cha)
    for (var i = 0; i < num - 1; i++) {
      x = str.indexOf(cha, x + 1)
    }
    return x
  },

  /**
   * 返回字符串在某个字符串中出现的次数
   * strCount('a23aaa23aa','23') : 2
   */
  strCount: function(s, c) {
    return s.split(c).length - 1
  },

  /**
   * 返回字符串中出现最多的字符和次数，返回json
   * stringMax('啊12啊啊啊3')
   */
  strFindMost: function(str) {
    var obj = {}
    for (var i = 0; i < str.length; i++) {
      var key = str[i] //key中存储的是每一个字符串
      if (obj[key]) {
        //判断这个键值对中有没有这个键
        obj[key]++
      } else {
        obj[key] = 1 //obj[w]=1
      }
    }
    var maxCount = 0 //假设是出现次数最多的次数
    var maxString = '' //假设这个字符串是次数出现最多的字符串
    for (var key in obj) {
      if (maxCount < obj[key]) {
        maxCount = obj[key] //保存最大的次数
        maxString = key
      }
    }
    return { value: maxString, count: maxCount }
  },

  /**
   * 清除字符串左侧或右侧的任意空格
   */
  strTrim: function(str) {
    return str.replace(/^\s+|\s+$/g, '')
  },

  /**
   * 清除左空格
   */
  strLTrim: function(str) {
    return str.replace(/^\s+/, '')
  },

  /**
   * 清除右空格
   */
  strRTrim: function(val) {
    return val.replace(/\s+$/, '')
  },

  /**
   * 反转字符串
   */
  strReverse: str => [...str].reverse().join(''),

  /**
   * 按字母顺序排序
   */
  strSortCharacters: str =>
    str
      .split('')
      .sort((a, b) => a.localeCompare(b))
      .join(''),

  /************************************************************************
   * 类型检测与转换
   ************************************************************************/

  /**
   * 返回一个二维数组
   * @param {*} x
   */
  map2arr: function(x) {
    return [...x]
  },

  /**
   * 传入一个二维数组，如[[a,1],[b,2]]
   */
  arr2map: function(x) {
    return new Map(x)
  },

  /**
   * Map对象的键值要为字符串，不能是复杂对象
   */
  map2obj: function(x) {
    //转为json对象
    let obj = Object.create(null)
    for (let [k, v] of x) {
      obj[k] = v
    }
    return obj
  },

  /**
   * 传入json对象，返回Map对象
   */
  obj2map: function(obj) {
    let strMap = new Map()
    for (let k of Object.keys(obj)) {
      strMap.set(k, obj[k])
    }
    return strMap
  },

  /**
   * 判断一个变量是否是假值
   * @param {*} str
   */
  isFalse: function(data) {
    if (!data) {
      return true
    } else {
      if (Object.prototype.toString.call(data) == '[object String]') {
        //是字符串
        let str = data.toLowerCase()
        if (str === 'null' || str === 'undefined') {
          return true
        }
      }
    }
    return false
  },

  /**
   * 把null或'null'或'undefined'转为''
   * null2empty(data, '')
   */
  null2empty: function(data, empty) {
    if (!data) {
      data = empty
    } else if (Object.prototype.toString.call(data) == '[object String]') {
      let str = data.toLowerCase()
      if (str === 'null' || str === 'undefined') {
        data = empty
      }
    }
    return data
  },

  /**
   * 是否是空的json对象：{}
   *
   */
  isObjEmpty: function(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object
  },

  /**
   * 是否是json对象
   *
   */
  isObj: function(obj) {
    return Object.prototype.toString.call(obj) == '[object Object]'
  },

  /**
   * 判断是否为一个数字
   * @param {*} value
   */
  isNumber: function(value) {
    return !isNaN(parseFloat(value)) && isFinite(value)
  },

  /**
   * 是否是数组
   */
  isArray: function(value) {
    return Object.prototype.toString.call(value) == '[object Array]'
  },

  /**
   * 是否是函数
   */
  isFunction: function(value) {
    return Object.prototype.toString.call(value) == '[object Function]'
  },

  /**
   * 是否是字符串
   */
  isString: str => Object.prototype.toString.call(str) == '[object String]',

  /**
   * 是否是布尔值
   */
  isBoolean: val => Object.prototype.toString.call(val) == '[object Boolean]',
}

module.exports = Util
