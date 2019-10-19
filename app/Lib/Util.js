/****************************************************************************
名称：常用工具函数集合
日期：2019年6月12日
****************************************************************************/

const Util = {
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
   * arrCount(['a', 'a', 'b'], 'a'): 2
   */
  arrCount: (arr, value) => arr.reduce((a, v) => (v === value ? a + 1 : a + 0), 0),

  /**
   * 返回去重后的数组
   * arrDistinct([1,2,2,3]): [1,2,3]
   */
  arrDistinct: arr => [...new Set(arr)],

  /**
   * 返回两个数组中相同的元素（注：不去重）
   * arrBothHas([1,2],[2,3]): [2]
   */
  arrBothHas: (a, b) => {
    const s = new Set(b)
    return a.filter(x => s.has(x))
  },

  /**
   * 返回两个数组中相同的元素（注：不去重，大小写不敏感）
   * arrBothHas(['A','b','C'], ['c']): ['c']
   */
  arrBothHas2: (a, b) => {
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
   * arrDeleteBothUnion([1,2],[2,3]): [1,3]
   */
  arrDeleteBothUnion: (a, b) => {
    const sA = new Set(a),
      sB = new Set(b)
    return [...a.filter(x => !sB.has(x)), ...b.filter(x => !sA.has(x))]
  },

  /**
   * 从A数组中删除AB数组同时存在的元素，返回一个新数组
   * arrDeleteBoth([1,2],[2,3]): [1]
   */
  arrDeleteBoth: (a, b) => {
    const s = new Set(b)
    return a.filter(x => !s.has(x))
  },

  /**
   * 2数组先去重，返回一个合并后的新数组
   * arrUnion([1,2],[2,3]): [1,2,3]
   */
  arrUnion: (a, b) => Array.from(new Set([...a, ...b])),

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
   * 检查给定数组中是否包含某值（不支持复杂元素的检查）
   * arrIsContains([1,2],3): false
   */
  arrIsContains: function(arr, val) {
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
   * arrIsContains2([1,2],3): false
   */
  arrIsContains2: function(arr, val) {
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
        reject(new Error('to要求参数是promise类型的函数'))
      }).catch(err => {
        return [err, null]
      })
    }
    return promise
      .then(function() {
        //console.log(arguments,'arguments')
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

  /**
   * 返回一个uuid
   */
  uuid: () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)),

  /************************************************************************
   * 对象类
   ************************************************************************/

  /**
   * 是否有某个属性/键
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
   * json对象：驼峰转为连字符
   */
  json2Line: obj => {
    let newObj = {}
    for (let key in obj) {
      newObj[str2Line(key)] = obj[key]
    }
    return newObj
  },
  /**
   * json对象：连字符转为驼峰
   */
  json2Camel: obj => {
    let newObj = {}
    for (let key in obj) {
      newObj[str2Camel(key)] = obj[key]
    }
    return newObj
  },

  // cleanObj: 移除从 JSON 对象指定的属性之外的任何特性
  // 使用Object.keys()方法可以遍历给定的 json 对象并删除在给定数组中不是included 的键。另外, 如果给它一个特殊的键 (childIndicator), 它将在里面深入搜索, 并将函数应用于内部对象
  cleanObj: (obj, keysToKeep = [], childIndicator) => {
    let o = obj,
      k = keysToKeep,
      c = childIndicator
    _cleanObj = (_obj, _keysToKeep = [], _childIndicator) => {
      Object.keys(_obj).forEach(key => {
        if (key === _childIndicator) {
          _cleanObj(_obj[key], _keysToKeep, _childIndicator)
        } else if (!_keysToKeep.includes(key)) {
          delete _obj[key]
        }
      })
    }
    return _cleanObj(o, k, c)
  },

  // objectFromParis: 从给定的键值对创建对象
  // 使用Array.reduce()创建和组合键值对
  objectFromPairs: arr => arr.reduce((a, v) => ((a[v[0]] = v[1]), a), {}),

  // objectToPairs: 从对象创建键值对数组
  // 使用Object.keys()和Array.map()循环访问对象的键并生成具有键值对的数组
  objectToPairs: obj => Object.keys(obj).map(k => [k, obj[k]]),

  // shallowClone: 创建对象的浅复制
  // 使用Object.assign()和一个空对象 ({}) 创建原始的浅克隆
  shallowClone: obj => Object.assign({}, obj),

  // truthCheckCollection: 检查谓词 (第二个参数) 是否 truthy 集合的所有元素 (第一个参数)
  // 使用Array.every()检查每个传递的对象是否具有指定的属性, 以及是否返回 truthy值
  truthCheckCollection: (collection, pre) => collection.every(obj => obj[pre]),

  /************************************************************************
   * 字符串类
   ************************************************************************/

  //返回字符串第n次出现的位置

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
   * 转义要在正则表达式中使用的字符串
   * @param {*} str
   */
  strEscapeRegExp: str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),

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

  // 只返回字符串a-z字符
  onlyLetters: function(str) {
    return str.toLowerCase().replace(/[^a-z]/g, '')
  },

  // 只返回字符串中a-z和数字
  onlyLettersNums: function(str) {
    return str.toLowerCase().replace(/[^a-z,0-9]/g, '')
  },

  // capitalize: 将字符串的第一个字母大写
  // 使用 destructuring 和toUpperCase()可将第一个字母、...rest用于获取第一个字母之后的字符数组, 然后是Array.join('')以使其成为字符串。省略lowerRest参数以保持字符串的其余部分不变, 或将其设置为true以转换为小写
  capitalize: ([first, ...rest], lowerRest = false) => first.toUpperCase() + (lowerRest ? rest.join('').toLowerCase() : rest.join('')),

  // capitalizeEveryWord: 将字符串中每个单词的首字母大写
  // 使用replace()匹配每个单词和toUpperCase()的第一个字符以将其大写
  capitalizeEveryWord: str => str.replace(/\b[a-z]/g, char => char.toUpperCase()),

  // fromCamelCase: 从驼峰表示法转换为字符串形式
  // 使用replace()可删除下划线、连字符和空格, 并将单词转换为匹配。省略第二个参数以使用默认分隔符_
  fromCamelCase: (str, separator = '_') =>
    str
      .replace(/([a-z\d])([A-Z])/g, '$1' + separator + '$2')
      .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1' + separator + '$2')
      .toLowerCase(),

  // toCamelCase: 字符串转换为驼峰模式
  // 使用replace()可删除下划线、连字符和空格, 并将单词转换为驼峰模式
  toCamelCase: str => str.replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2, offset) => (p2 ? p2.toUpperCase() : p1.toLowerCase())),

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
   * @param {*} obj
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
   * @param {*} obj
   */
  isJsonEmpty: function(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object
  },

  /**
   * 是否是json对象
   * @param {*} obj
   */
  isJson: function(obj) {
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
  // 或
  // isArray: val => !!val && Array.isArray(val),

  /**
   * 是否是函数
   */
  isFunction: function(value) {
    return Object.prototype.toString.call(value) == '[object Function]'
  },
  // 或
  // isFunction: val => val && typeof val === "function",

  /**
   * 是否是正则表达式
   * @param {*} value
   */
  isRegExp: function(value) {
    return Object.prototype.toString.call(value) == '[object RegExp]'
  },

  /**
   * 是否是字符串
   */
  isString: str => Object.prototype.toString.call(str) == '[object String]',
  // 或
  // isString: val => typeof val === "string",

  /**
   * 是否是布尔值
   */
  isBoolean: val => Object.prototype.toString.call(val) == '[object Boolean]',
  // 或
  // isBoolean: val => typeof val === "boolean",

  // 判断是否为Symbol
  isSymbol: val => Object.prototype.toString.call(val) == '[object Symbol]',
  // 或
  // isSymbol: val => typeof val === "symbol",
}

module.exports = Util
