/**
 * 工具类
 * 封装 js-cookie、dayjs 等常用库及自定义方法
 */
class Tools {
  /**
   * 初始化工具类
   * @throws {Error} 如果依赖库未正确加载则抛出错误
   */
  constructor() {
    // 检查依赖是否存在
    if (typeof Cookies === 'undefined') {
      throw new Error('js-cookie 库未加载')
    }
    if (typeof dayjs === 'undefined') {
      throw new Error('dayjs 库未加载')
    }

    // 直接代理原始库
    this.cookie = Cookies
    this.dayjs = dayjs

    // 翻译过期时间（15分钟）
    this.TRANSLATION_EXPIRE_MINUTES = 15

    // 初始化自定义方法库
    this.Util = this._initTools()

    // 添加翻译状态标志
    this.translationReady = false

    // 初始化翻译方法
    this.trans = this._initTrans()

    // 初始化权限检查方法
    this.hasPermission = this._initHasPermission()

    // 初始化加载状态
    this._initState()
  }

  /**
   * 初始化权限检查方法
   * @private
   * @returns {Function} 权限检查函数
   */
  _initHasPermission() {
    return (key) => {
      return !!(window.globalData && window.globalData.permissions && window.globalData.permissions[key])
    }
  }

  /**
   * 初始化翻译方法
   * @private
   * @returns {Function} 翻译函数
   */
  _initTrans() {
    const self = this // 保存 Tools 实例的引用
    return (source, params) => {
      try {
        const transString = localStorage.getItem('translation')
        if (!transString) {
          console.log('no translation in localStorage:', source)
          return source
        }
        const trans = JSON.parse(transString)
        let result = trans[`node#${source}`]
        if (!result) {
          console.log('no translation for:', source)
          return source
        }
        if (self.Util.isArray(params) && params.length > 0 && result.includes('[[')) {
          for (let i = 0; i < params.length; i++) {
            result = result.replace(`[[${i}]]`, params[i])
          }
        }

        return result
      } catch (e) {
        console.log(e.message)
        return source
      }
    }
  }

  /**
   * 初始化加载状态
   * @private
   */
  _initState() {
    // 添加一个遮罩层到 body
    const overlay = document.createElement('div')
    overlay.id = 'translation-loading-overlay'
    overlay.className = 'fixed inset-0 flex items-center justify-center'
    overlay.style.cssText = 'background-color: rgba(0, 0, 0, 0.2); z-index:9999;'
    // overlay.style.cssText = 'background-color: #eeeeee; z-index:9999;'
    overlay.innerHTML = `
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div class="flex items-center gap-2 px-4 py-2 font-medium leading-none text-2sm border border-gray-200 shadow-default rounded-md text-gray-500 bg-light">
          <svg class="animate-spin -ml-1 h-5 w-5 text-gray-600" fill="none" viewbox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3">
          </circle>
          <path class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor">
          </path>
          </svg>
        </div>
      </div>
    `
    document.body.appendChild(overlay)
  }

  /**
   * 初始化自定义方法库
   * @private
   */
  _initTools() {
    const self = this // 保存 Tools 实例的引用
    return {
      /************************************************************************
       * 翻译相关方法
       ************************************************************************/

      /**
       * 检查翻译是否需要更新
       * @returns {Promise<boolean>} 如果需要更新返回true，否则返回false
       */
      async checkTranslationUpdate() {
        try {
          const translationData = localStorage.getItem('translation')
          const lastUpdateTime = localStorage.getItem('translation_update_time')

          if (!translationData || !lastUpdateTime) {
            return true
          }

          // 检查是否过期（15分钟）
          const lastUpdate = dayjs(parseInt(lastUpdateTime))
          const now = dayjs()
          if (now.diff(lastUpdate, 'minute') >= self.TRANSLATION_EXPIRE_MINUTES) {
            return true
          }

          return false
        } catch (error) {
          console.error('检查翻译更新失败:', error)
          return true // 发生错误时建议更新翻译
        }
      },

      /**
       * 从服务器更新翻译
       * @returns {Promise<void>}
       */
      async updateTranslation() {
        try {
          const response = await axios.post('/api/get-translation')
          const translations = response.data.data.translation
          self.Util.setTranslation(translations)
        } catch (error) {
          console.error('更新翻译失败:', error)
          throw error
        }
      },

      /**
       * 设置翻译数据并标记为就绪
       * @param {Object} translations - 翻译数据对象
       */
      setTranslation(translations) {
        if (translations) {
          localStorage.setItem('translation', translations)
          // 记录更新时间
          localStorage.setItem('translation_update_time', Date.now().toString())
        }
        self.translationReady = true

        // 移除加载遮罩
        const overlay = document.getElementById('translation-loading-overlay')
        if (overlay) {
          overlay.classList.add('opacity-0')
          setTimeout(() => overlay.remove(), 300) // 添加淡出效果
        }
      },

      /************************************************************************
       * Arrays
       ************************************************************************/

      /**
       * 把对象数组中，某个键的值当成键，并分组
       * @example
       * arrGroupBy(memberList, 'role_name')
       * @returns object
       */
      arrGroupBy: (arr, key) => {
        let groupedByKey = {}
        arr.map((obj) => {
          if (groupedByKey[obj[key]]) groupedByKey[obj[key]].push(obj)
          else groupedByKey[obj[key]] = [obj]
        })
        return groupedByKey
      },

      /**
       * 返回数组中的最大值
       * arrMax([1,2,3]) 返回 3
       */
      arrMax: (arr) => Math.max(...arr),

      /**
       * 返回数组中的最小值
       *  arrMin([1,2,3]) 返回 1
       */
      arrMin: (arr) => Math.min(...arr),

      /**
       * 将数组块平均拆分为指定大小的较小数组，返回一个二维数组。
       * arrSplit([1,2,3,4,5],2) 返回 [[1,2],[3,4],[5]]
       */
      arrSplit: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size)),

      /**
       * 计算数组中某个元素值的出现次数（大小写敏感）
       * arrItemCount(['a', 'a', 'b'], 'a') 返回 2
       */
      arrItemCount: (arr, value) => arr.reduce((a, v) => (v === value ? a + 1 : a + 0), 0),

      /**
       * 返回去重后的数组
       * arrNoDouble([1,2,2,3]) 返回 [1,2,3]
       */
      arrNoDouble: (arr) => [...new Set(arr)],

      /**
       * 返回两个数组中相同的元素（注：大小写敏感）
       * arrRetainDoubleCase([1,2],[2,3]) 返回 [2]
       */
      arrRetainDoubleCase: (a, b) => {
        const s = new Set(b)
        return a.filter((x) => s.has(x))
      },

      /**
       * 返回两个数组中相同的元素（注：大小写不敏感）
       * arrRetainDouble(['A','b','C'], ['c']) 返回 ['c']
       */
      arrRetainDouble: (a, b) => {
        let a1 = [],
          b1 = []
        for (let i of b) {
          b1.push(i.toLowerCase())
        }
        for (let i of a) {
          a1.push(i.toLowerCase())
        }
        const s = new Set(b1)
        return a1.filter((x) => s.has(x))
      },

      /**
       * 删除2个数组同时存在的元素，返回一个合并后的新数组
       * arrDeleteDoubleAndUnion([1,2],[2,3]) 返回 [1,3]
       */
      arrDeleteDoubleAndUnion: (a, b) => {
        const sA = new Set(a),
          sB = new Set(b)
        return [...a.filter((x) => !sB.has(x)), ...b.filter((x) => !sA.has(x))]
      },

      /**
       * 从A数组中删除AB数组同时存在的元素，返回一个新数组
       * arrDeleteDouble([1,2],[2,3]) 返回 [1]
       */
      arrDeleteDouble: (a, b) => {
        const s = new Set(b)
        return a.filter((x) => !s.has(x))
      },

      /**
       * 2个数组合并、去重、返回一个新数组
       * arrNoDoubleUnion([1,2],[2,3]) 返回 [1,2,3]
       */
      arrNoDoubleUnion: (a, b) => Array.from(new Set([...a, ...b])),

      /**
       * 返回数组中的所有元素, 除第一个
       * arrDeleteFirst([1,2,3]) 返回 [2,3]
       */
      arrDeleteFirst: (arr) => (arr.length > 1 ? arr.slice(1) : arr),

      /**
       * 返回数组中的所有元素, 除最后一个
       * arrDeleteLast([1,2,3]) 返回 [1,2]
       */
      arrDeleteLast: (arr) => arr.slice(0, -1),

      /**
       * 返回从右边开始数，第n个位置开始的数组
       * arrSliceLast([1,2,3],2) 返回 [2,3]
       */
      arrSliceLast: (arr, n = 1) => arr.slice(arr.length - n, arr.length),

      /**
       * 删除指定的元素值（可多个），返回一个新数组
       * arrDelete(['a','b','c','d','e'],'a','c') 返回 ['b','d','e']
       */
      arrDelete: (arr, ...args) => arr.filter((v) => !args.includes(v)),

      /**
       * 删除指定的元素值，返回原数组，原数组改变
       * arrDeleteRaw['a','b','c','d','e'],'d') 返回 ['a','b','c','e']
       */
      arrDeleteRaw: function (arr, val) {
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
       * arrIncludesCase([1,2],3) 返回 false
       * 等同于js原生[1,2].includes(3)
       */
      arrIncludesCase: function (arr, val) {
        var i = arr.length
        while (i--) {
          if (arr[i] === val) {
            return true
          }
        }
        return false
      },

      /**
       * 判断数组中是否包含某值（大小写不敏感）
       * arrIncludes([1,2],3) 返回 false
       */
      arrIncludes: function (arr, val) {
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
      arr2LowerCase: function (arr) {
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
      arrRandomValue: (arr) => arr[Math.floor(Math.random() * arr.length)],

      /**
       * 返回一个打乱了顺序的数组
       * arrRandomSort([1,2,3]): 可能返回[2,1,3]
       */
      arrRandomSort: (arr) => arr.sort(() => Math.random() - 0.5),

      /**
       * 返回数组中每间隔n个的那些元素组成的数组
       * arrEveryNth([1,2,3,4,5,6,7,8,9,10],3): [1, 4, 7, 10]
       */
      arrEveryNth: (arr, nth) => arr.filter((e, i) => i % nth === 0),

      /**
       * 返回数字数组的平均值(浮点数)
       */
      arrAvg: (arr) => arr.reduce((acc, val) => acc + val, 0) / arr.length,

      /**
       * 返回一个数字数组的总和
       */
      arrSum: (arr) => arr.reduce((acc, val) => acc + val, 0),

      /************************************************************************
       * 日期类
       ************************************************************************/
      /**
       * 把秒数换算成天、时、分、秒组成的json
       * number2timeJson(10000) 返回 {second: 40, minute: 46, hour: 2, day: 0}
       */
      number2timeJson: function (value) {
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

      /************************************************************************
       * 函数类
       ************************************************************************/

      /**
       * 防抖：最后一次触发后延迟执行
       * @param {Function} func 要防抖的函数
       * @param {number} wait 延迟毫秒数
       * @param {Object} options 配置项
       * @param {boolean} options.leading 是否在延迟开始前调用
       * @param {boolean} options.trailing 是否在延迟结束后调用
       * @returns {Function} 返回新的防抖函数
       * @example
       * debounce(fn, 500)
       * debounce(fn, 500, { leading: true })
       */
      debounce: function (func, wait = 0, options = {}) {
        let lastArgs, lastThis, maxWait, result, timerId, lastCallTime

        let lastInvokeTime = 0
        let leading = false
        let maxing = false
        let trailing = true

        // 处理配置项
        if (typeof options === 'object') {
          leading = !!options.leading
          trailing = 'trailing' in options ? !!options.trailing : trailing
        }

        function invokeFunc(time) {
          const args = lastArgs
          const thisArg = lastThis

          lastArgs = lastThis = undefined
          lastInvokeTime = time
          result = func.apply(thisArg, args)
          return result
        }

        function startTimer(pendingFunc, wait) {
          return setTimeout(pendingFunc, wait)
        }

        function cancelTimer(id) {
          clearTimeout(id)
        }

        function leadingEdge(time) {
          lastInvokeTime = time
          // 开始定时器，处理 trailing edge 的调用
          timerId = startTimer(timerExpired, wait)
          // 如果配置了 leading=true，立即调用
          return leading ? invokeFunc(time) : result
        }

        function remainingWait(time) {
          const timeSinceLastCall = time - lastCallTime
          const timeSinceLastInvoke = time - lastInvokeTime
          const timeWaiting = wait - timeSinceLastCall

          return timeWaiting
        }

        function shouldInvoke(time) {
          const timeSinceLastCall = time - lastCallTime
          const timeSinceLastInvoke = time - lastInvokeTime

          return lastCallTime === undefined || timeSinceLastCall >= wait
        }

        function timerExpired() {
          const time = Date.now()
          if (shouldInvoke(time)) {
            return trailingEdge(time)
          }
          // 重启定时器
          timerId = startTimer(timerExpired, remainingWait(time))
        }

        function trailingEdge(time) {
          timerId = undefined

          // 只有在有未执行的参数，且允许 trailing 时才执行
          if (trailing && lastArgs) {
            return invokeFunc(time)
          }
          lastArgs = lastThis = undefined
          return result
        }

        function cancel() {
          if (timerId !== undefined) {
            cancelTimer(timerId)
          }
          lastInvokeTime = 0
          lastArgs = lastCallTime = lastThis = timerId = undefined
        }

        function flush() {
          return timerId === undefined ? result : trailingEdge(Date.now())
        }

        function debounced(...args) {
          const time = Date.now()
          const isInvoking = shouldInvoke(time)

          lastArgs = args
          lastThis = this
          lastCallTime = time

          if (isInvoking) {
            if (timerId === undefined) {
              return leadingEdge(lastCallTime)
            }
          }
          if (timerId === undefined) {
            timerId = startTimer(timerExpired, wait)
          }
          return result
        }

        debounced.cancel = cancel
        debounced.flush = flush
        return debounced
      },

      /**
       * 节流：持续触发时，保证每 wait 毫秒内只执行一次
       * @param {Function} func 要节流的函数
       * @param {number} wait 等待毫秒数
       * @param {Object} options 配置项
       * @param {boolean} options.leading 是否在开始时立即执行
       * @param {boolean} options.trailing 是否在结束后补充执行
       * @returns {Function} 返回节流后的函数
       * @example
       * throttle(fn, 1000)
       * throttle(fn, 1000, { leading: false })
       */
      /**
       * 节流：持续触发时，保证每 wait 毫秒内只执行一次
       * @param {Function} func 要节流的函数
       * @param {number} wait 等待毫秒数
       * @param {Object} options 配置项
       * @param {boolean} options.leading 是否在开始时立即执行
       * @param {boolean} options.trailing 是否在结束后补充执行
       * @returns {Function} 返回节流后的函数
       * @example
       * throttle(fn, 1000)
       * throttle(fn, 1000, { leading: false })
       */
      throttle: function (func, wait = 0, options = {}) {
        let lastArgs, lastThis, result, timerId, lastCallTime
        let lastInvokeTime = 0
        let leading = true
        let trailing = true

        if (typeof options === 'object') {
          leading = 'leading' in options ? !!options.leading : leading
          trailing = 'trailing' in options ? !!options.trailing : trailing
        }

        function invokeFunc(time) {
          const args = lastArgs
          const thisArg = lastThis

          lastArgs = lastThis = undefined
          lastInvokeTime = time
          result = func.apply(thisArg, args)
          return result
        }

        function startTimer(pendingFunc, wait) {
          return setTimeout(pendingFunc, wait)
        }

        function leadingEdge(time) {
          lastInvokeTime = time
          // 开始定时器，处理 trailing edge 的调用
          timerId = startTimer(timerExpired, wait)
          // 如果配置了 leading=true，立即调用
          return leading ? invokeFunc(time) : result
        }

        function remainingWait(time) {
          const timeSinceLastCall = time - lastCallTime
          const timeSinceLastInvoke = time - lastInvokeTime
          const timeWaiting = wait - timeSinceLastCall

          return timeWaiting
        }

        function shouldInvoke(time) {
          const timeSinceLastCall = time - lastCallTime
          const timeSinceLastInvoke = time - lastInvokeTime

          return lastCallTime === undefined || timeSinceLastCall >= wait
        }

        function timerExpired() {
          const time = Date.now()
          if (shouldInvoke(time)) {
            return trailingEdge(time)
          }
          // 重启定时器
          timerId = startTimer(timerExpired, remainingWait(time))
        }

        function trailingEdge(time) {
          timerId = undefined

          // 只有在有未执行的参数，且允许 trailing 时才执行
          if (trailing && lastArgs) {
            return invokeFunc(time)
          }
          lastArgs = lastThis = undefined
          return result
        }

        function throttled(...args) {
          const time = Date.now()
          const isInvoking = shouldInvoke(time)

          lastArgs = args
          lastThis = this
          lastCallTime = time

          if (isInvoking) {
            if (timerId === undefined) {
              return leadingEdge(lastCallTime)
            }
          }
          if (timerId === undefined) {
            timerId = startTimer(timerExpired, wait)
          }
          return result
        }

        throttled.cancel = function () {
          if (timerId !== undefined) {
            clearTimeout(timerId)
          }
          lastInvokeTime = 0
          lastArgs = lastCallTime = lastThis = timerId = undefined
        }

        return throttled
      },

      /**
       * 让程序暂停 n 毫秒
       * await sleep(1000)
       */
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

      /************************************************************************
       * Math 数学类
       ************************************************************************/

      /**
       * 将数字四舍五入到指定的位数
       */
      mathRound: (num, n = 0) => {
        num = parseFloat(num)
        n = parseInt(n)
        return (Math.round(num * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n)
      },

      /**
       * 两个参数之间的随机整数
       * mathRandomDuration(5,7) 返回随机数：5 <= x <= 7
       */
      mathRandomInt: (lowerValue, upperValue) => {
        var chioces = upperValue - lowerValue + 1
        return Math.floor(Math.random() * chioces + lowerValue)
      },

      /**
       * 两个参数之间的随机浮点数
       * mathRandomDuration(5,7) 返回随机数：5 <= x <= 7
       */
      mathRandomFloat: (min, max) => Math.random() * (max - min) + min,

      /************************************************************************
       * 对象类
       ************************************************************************/

      /**
       * 对象的键值按升序排列
       */
      objKsort: (params) => {
        let keys = Object.keys(params).sort()
        let newParams = {}
        keys.forEach((key) => {
          newParams[key] = params[key]
        })
        return newParams
      },

      /**
       * 删除对象的空属性
       * @example
       *
       */
      objDeleteEmpty: (obj) => {
        Object.keys(obj).forEach((key) => !obj[key] && delete obj[key])
        return obj
      },

      /**
       * 复制并过滤：第二个参数覆盖第一个参数，且第二个参数多余的key不理睬
       * @example
       * assignFilter({name}, {name:'xx', aa:1 }) 返回 {name: 'xx'}
       * @returns object
       */
      assignFilter: (expectObj, rawObj) => {
        for (let k in rawObj) {
          if (expectObj.hasOwnProperty(k)) {
            expectObj[k] = rawObj[k]
          }
        }
        return expectObj
      },

      /**
       * 是否有某个属性/键（大小写敏感）
       * objHas({aa:1}, 'aa'): true
       */
      objHas: function (obj, key) {
        return obj.hasOwnProperty(key)
      },

      /************************************************************************
       * 字符串类
       ************************************************************************/

      /*
       * 删除bom头 \xef\xbb\xbf
       */
      strDeleteBOM: function (content) {
        if (content.charCodeAt(0) === 0xfeff) {
          content = content.slice(1)
        }
        return content
      },

      /**
       * 返回字符串第n次出现的下标位置
       * strIndexOfMulti('00ab00ab', 'ab', 2) 返回 6
       * @param {字符串} str
       * @param {待查找} cha
       * @param {第n次出现} num
       */
      strIndexOfMulti: function (str, cha, num) {
        var x = str.indexOf(cha)
        for (var i = 0; i < num - 1; i++) {
          x = str.indexOf(cha, x + 1)
        }
        return x
      },

      /**
       * 返回字符串在某个字符串中出现的次数
       * strCount('a23aaa23aa','23') 返回 2
       */
      strCount: function (s, c) {
        return s.split(c).length - 1
      },

      /**
       * 返回字符串中出现最多的字符和次数，返回json对象
       * strFindMost('啊12啊啊啊3') 返回 {value: "啊", count: 4}
       */
      strFindMost: function (str) {
        let obj = {}
        for (let i = 0; i < str.length; i++) {
          let key = str[i] //key中存储的是每一个字符串
          if (obj[key]) {
            //判断这个键值对中有没有这个键
            obj[key]++
          } else {
            obj[key] = 1 //obj[w]=1
          }
        }
        let maxCount = 0 //假设是出现次数最多的次数
        let maxString = '' //假设这个字符串是次数出现最多的字符串
        for (let key in obj) {
          if (maxCount < obj[key]) {
            maxCount = obj[key] //保存最大的次数
            maxString = key
          }
        }
        return { value: maxString, count: maxCount }
      },

      /**
       * 清除字符串的任意空格
       * strDeleteSpace('  he l lo  ') 返回 hello
       */
      strDeleteSpace: (str) => str.replace(/\s/g, ''),

      /**
       * 清除左空格
       */
      strLTrim: function (str) {
        return str.replace(/^\s+/, '')
      },

      /**
       * 清除右空格
       */
      strRTrim: function (val) {
        return val.replace(/\s+$/, '')
      },

      /**
       * 反转字符串
       * strReverse('abc') 返回 'cba'
       */
      strReverse: (str) => [...str].reverse().join(''),

      /**
       * 按字母顺序排序
       * strSort('badce') 返回 'abcde'
       */
      strSort: (str) =>
        str
          .split('')
          .sort((a, b) => a.localeCompare(b))
          .join(''),

      /**
       * md5
       */
      md5: (str) => {
        if (!str) {
          return ''
        }
        return crypto.createHash('md5').update(str).digest('hex')
      },

      /**
       * sha1
       */
      sha1(str) {
        if (!str) {
          return ''
        }
        return crypto
          .createHash('sha1')
          .update(str + '', 'binary')
          .digest('hex')
      },

      sha256(str, format = 'base64') {
        if (!str) {
          return ''
        }
        return crypto
          .createHash('sha256')
          .update(str + '', 'binary')
          .digest(format)
      },

      sha1WithRSA(str, privateKeyPEM, format = 'base64') {
        // const privateKeyPEM =
        //     '-----BEGIN PRIVATE KEY-----\n' +
        //     'MIIEvQIBADA......NBgPSyxc=\n' +
        //     '-----END PRIVATE KEY-----'
        // 创建签名对象
        const signer = crypto.createSign('RSA-SHA1')
        signer.update(str)

        // 对数据进行签名
        const signature = signer.sign(privateKeyPEM, format)
        return signature
      },

      sha256WithRSA(str, privateKeyPEM, format = 'base64') {
        // const privateKeyPEM =
        //     '-----BEGIN PRIVATE KEY-----\n' +
        //     'MIIEvQIBADA......NBgPSyxc=\n' +
        //     '-----END PRIVATE KEY-----'
        // 创建签名对象
        const signer = crypto.createSign('RSA-SHA256')
        signer.update(str)

        // 对数据进行签名
        const signature = signer.sign(privateKeyPEM, format)
        return signature
      },

      /**
       * hmac sha1加密，并返回base64形式的编码
       * @example
       *
       */
      hmacSha1(str, secret, format = 'base64') {
        if (!str) {
          return ''
        }
        return crypto.createHmac('sha1', secret).update(str).digest(format)
      },

      /**
       * hmac sha256加密，并返回hex形式的编码
       * @example
       *
       */
      hmacSha256(str, secret, format = 'hex') {
        if (!str) {
          return ''
        }
        return crypto.createHmac('sha256', secret).update(str).digest(format)
      },

      /**
       * hmac sha512加密，并返回hex形式的编码
       * @example
       *
       */
      hmacSha512(str, secret, format = 'hex') {
        if (!str) {
          return ''
        }
        return crypto.createHmac('sha512', secret).update(str).digest(format)
      },

      base64(str) {
        // create a buffer
        const buff = Buffer.from(str, 'utf-8')
        // encode buffer as Base64
        const base64 = buff.toString('base64')

        return base64
      },

      /************************************************************************
       * 类型检测与转换
       ************************************************************************/

      /**
       * Map转二维数组
       */
      map2arr: function (x) {
        return [...x]
      },

      /**
       * 二维数组转Map，如[[a,1],[b,2]]可转成Map对象
       */
      arr2map: function (x) {
        return new Map(x)
      },

      /**
       * Map转json对象
       * Map对象的键值要为字符串，不能是复杂对象
       */
      map2obj: function (x) {
        //转为json对象
        let obj = Object.create(null)
        for (let [k, v] of x) {
          obj[k] = v
        }
        return obj
      },

      /**
       * json对象转Map
       * 传入json对象，返回Map对象
       */
      obj2map: function (obj) {
        let strMap = new Map()
        for (let k of Object.keys(obj)) {
          strMap.set(k, obj[k])
        }
        return strMap
      },

      /**
       * 判断一个变量是否是false
       * 有的字符串值为'null'、'undefined'也认为是false
       */
      isFalse: function (data) {
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
      null2empty: function (data, empty) {
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
      isObjEmpty: function (obj) {
        return Object.keys(obj).length === 0 && obj.constructor === Object
      },

      /**
       * 是否是json对象
       *
       */
      isObj: function (obj) {
        return Object.prototype.toString.call(obj) == '[object Object]'
      },

      /**
       * 判断是否为一个数字
       * @param {*} value
       */
      isNumber: function (value) {
        return !isNaN(parseFloat(value)) && isFinite(value)
      },

      /**
       * 是否是数组
       */
      isArray: function (value) {
        return Object.prototype.toString.call(value) == '[object Array]'
      },

      /**
       * 是否是函数
       */
      isFunction: function (value) {
        return Object.prototype.toString.call(value) == '[object Function]'
      },

      /**
       * 是否是字符串
       */
      isString: (str) => Object.prototype.toString.call(str) == '[object String]',

      /**
       * 是否是布尔值
       */
      isBoolean: (val) => Object.prototype.toString.call(val) == '[object Boolean]',

      /**
       * 显示成功消息
       * @param {string|Object} options - 消息内容或配置对象 { msg: string }
       * @param {Function} [callback] - 点击确认按钮后的回调函数
       */
      successMsg: function (options, callback) {
        const msg = typeof options === 'string' ? options : options.msg
        alert(msg)
        if (callback && typeof callback === 'function') {
          callback()
        }
      },

      /**
       * 显示错误消息
       * @param {string|Object} options - 消息内容或配置对象 { msg: string }
       * @param {Function} [callback] - 点击确认按钮后的回调函数
       */
      errorMsg: function (options, callback) {
        const msg = typeof options === 'string' ? options : options.msg
        alert(msg)
        if (callback && typeof callback === 'function') {
          callback()
        }
      },

      /************************************************************************
       * 表单处理
       ************************************************************************/

      /**
       * 通用表单提交处理函数
       * @param {string} formSelector - 表单选择器
       * @param {string} btnSelector - 提交按钮选择器
       * @param {Function} submitCallback - 异步回调函数，处理实际的提交逻辑
       * @param {Object} options - 可选配置项
       * @param {Function} options.onSuccess - 成功回调函数
       * @param {Function} options.onError - 错误回调函数
       * @param {boolean} options.useOverlay - 是否使用全屏遮罩,默认false
       * @example
       * Util.handleFormSubmit('#myForm', '#submitBtn', async (formData) => {
       *   const response = await axios.post('/api/save', formData);
       *   return response.data;
       * }, { useOverlay: true });
       */
      handleFormSubmit: (formSelector, btnSelector, submitCallback, options = {}) => {
        const form = document.querySelector(formSelector)
        const submitBtn = document.querySelector(btnSelector)

        if (!form || !submitBtn) {
          console.error('表单或提交按钮未找到')
          return
        }

        // 防止重复提交标志
        let isSubmitting = false

        // 获取按钮内的加载指示器元素
        const indicatorLabel = submitBtn.querySelector('.indicator-label')
        const indicatorProgress = submitBtn.querySelector('.indicator-progress')

        // 创建全屏遮罩
        let overlay
        if (options.useOverlay) {
          overlay = document.createElement('div')
          overlay.className = 'fixed inset-0 flex items-center justify-center z-50 hidden'
          overlay.style.cssText = 'background-color: rgba(0, 0, 0, 0.2);'
          overlay.innerHTML = `
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div class="flex items-center gap-2 px-4 py-2 font-medium leading-none text-2sm border border-gray-200 shadow-default rounded-md text-gray-500 bg-light">
                <svg class="animate-spin -ml-1 h-5 w-5 text-gray-600" fill="none" viewbox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3">
                </circle>
                <path class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor">
                </path>
                </svg>
              </div>
            </div>
          `
          document.body.appendChild(overlay)
        }

        // 创建提交处理函数
        const handleSubmit = async function (e) {
          e.preventDefault()

          // 防止重复提交
          if (isSubmitting) return

          try {
            // 显示加载状态
            if (indicatorLabel && indicatorProgress) {
              indicatorLabel.classList.add('hidden')
              indicatorProgress.classList.remove('hidden')
            }
            submitBtn.disabled = true
            isSubmitting = true

            // 显示遮罩
            if (overlay) {
              overlay.classList.remove('hidden')
            }

            // 收集表单数据
            const formData = new FormData(form)

            // 移除空文件
            for (let [key, value] of formData.entries()) {
              if (value instanceof File && value.size === 0) {
                formData.delete(key)
              }
            }

            const result = await submitCallback(formData)

            // 调用成功回调
            if (options.onSuccess) {
              options.onSuccess(result)
            }
          } catch (err) {
            console.error(err)
            // 调用错误回调
            if (options.onError) {
              options.onError(err)
            } else {
              // 默认错误处理
              showError(err.message || '操作失败')
            }
          } finally {
            // 恢复按钮状态
            if (indicatorLabel && indicatorProgress) {
              indicatorLabel.classList.remove('hidden')
              indicatorProgress.classList.add('hidden')
            }
            submitBtn.disabled = false
            isSubmitting = false

            // 隐藏遮罩
            if (overlay) {
              overlay.classList.add('hidden')
            }
          }
        }

        // 添加事件监听器
        form.addEventListener('submit', handleSubmit)

        // 添加页面卸载时的清理
        const cleanup = () => {
          form.removeEventListener('submit', handleSubmit)
          if (overlay) {
            overlay.remove()
          }
          window.removeEventListener('unload', cleanup)
        }
        window.addEventListener('unload', cleanup)
      },

      /************************************************************************
       * URL 参数处理
       ************************************************************************/

      /**
       * 获取当前URL中的所有参数
       * @returns {Object} 参数对象
       */
      getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search)
        const params = {}
        for (const [key, value] of urlParams.entries()) {
          if (value) {
            params[key] = value
          }
        }
        return params
      },

      /**
       * 更新URL参数
       * @param {Object} params - 要更新的参数对象
       */
      updateUrlParams(params) {
        const url = new URL(window.location.href)
        // 移除所有现有参数
        url.search = ''
        // 添加新参数
        Object.entries(params).forEach(([key, value]) => {
          if (value) {
            url.searchParams.set(key, value)
          }
        })
        // 更新URL，不刷新页面
        window.history.pushState({}, '', url)
      },

      /**
       * 清除所有URL参数
       */
      clearUrlParams() {
        window.history.pushState({}, '', window.location.pathname)
      },

      /**
       * 根据URL参数设置表单值
       * @param {string} formSelector - 表单选择器
       * @returns {Object} 包含page和pageSize的对象
       */
      setFormFromUrl(formSelector) {
        const urlParams = new URLSearchParams(window.location.search)
        const form = document.querySelector(formSelector)

        if (!form) return { page: 1, pageSize: 5 }

        // 设置表单值
        form.querySelectorAll('input, select').forEach((element) => {
          const value = urlParams.get(element.name)
          if (value) {
            element.value = value
          }
        })

        return {
          page: parseInt(urlParams.get('page')) || 1,
          pageSize: parseInt(urlParams.get('size')) || 5,
        }
      },

      /************************************************************************
       * 数据表格工具
       ************************************************************************/

      /**
       * 初始化数据表格
       * @param {string} selector - 表格选择器
       * @param {Object} options - 配置项
       */
      initDataTable(selector, options) {
        const defaultOptions = {
          requestMethod: 'POST',
          requestHeaders: {
            'Content-Type': 'application/x-www-form-urlencoded',
            token: localStorage.getItem('token'),
          },
          stateSave: false,
          info: '第{start} - {end} / 共{total}条',
          infoEmpty: '没有数据',
          pageSizes: [5, 10, 20, 50, 100],
          pageSize: 5,
          pageMore: '更多',
          pageMoreLimit: 5,
          mapRequest: function (params) {
            // 获取表单元素
            const form = document.querySelector('form')
            if (!form) return params

            const formData = new FormData(form)
            // 遍历表单数据，只添加非空参数
            for (const [key, value] of formData.entries()) {
              if (value && typeof value === 'string' && value.trim()) {
                params.set(key, value.trim())
              }
            }

            // 如果需要列排序，则要自定义排序字段映射
            // const sortFieldMapping = {
            //   1: 'nickname',
            //   2: 'email',
            //   3: 'created_at',
            //   // 添加其他字段映射
            // }
            // const sortField = params.get('sortField');
            // if (sortField && sortFieldMapping[sortField]) {
            //   params.set('sortField', sortFieldMapping[sortField]);
            // }

            return params
          },
          loading: {
            template:
              '<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">' +
              '<div class="flex items-center gap-2 px-4 py-2 font-medium leading-none text-2sm border border-gray-200 shadow-default rounded-md text-gray-500 bg-light">' +
              '<svg class="animate-spin -ml-1 h-5 w-5 text-gray-600" fill="none" viewbox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
              '<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3">' +
              '</circle>' +
              '<path class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor">' +
              '</path>' +
              '</svg>' +
              '{content}' +
              '</div>' +
              '</div>',
            content: '',
          },
        }

        // 合并配置
        const finalOptions = Object.assign({}, defaultOptions, options)

        // 设置初始页码
        if (finalOptions.initialPage) {
          finalOptions._state = {
            page: finalOptions.initialPage,
          }
        }

        const datatableEl = document.querySelector(selector)
        if (!datatableEl) return null

        const datatable = new KTDataTable(datatableEl, finalOptions)

        // 监听分页变化
        datatable.on('pagination', () => {
          // 等待一下确保状态已更新
          setTimeout(() => {
            this.updateUrlParams(this.getAllTableParams(datatable))
          }, 0)
        })

        // 监听每页条数变化
        const pageSizeSelect = datatableEl.querySelector('[data-datatable-size="true"]')
        if (pageSizeSelect) {
          pageSizeSelect.addEventListener('change', (e) => {
            const newSize = parseInt(e.target.value)
            if (!isNaN(newSize)) {
              // 先更新URL中的size参数
              const params = this.getAllTableParams(datatable)
              params.size = newSize
              params.page = 1 // 切换每页条数时重置为第1页
              this.updateUrlParams(params)
            }
          })
        }

        return datatable
      },

      /**
       * 处理单行删除
       * @param {Object} options - 配置项
       */
      handleRowDelete(options) {
        const tableId = options.tableId
        const deleteApi = options.deleteApi
        const onSuccess = options.onSuccess

        // 处理删除按钮点击
        document.addEventListener('click', async function (e) {
          const btn = e.target.closest('.remove-btn')
          if (!btn) return

          const confirmed = await showConfirm('确定要删除这条记录吗？', {
            persistent: true,
            confirmText: '删除',
            cancelText: '取消',
          })
          if (!confirmed) {
            return
          }

          // 获取按钮元素
          const loadingEl = btn.querySelector('.menu-title')
          if (!loadingEl) return

          const originalText = loadingEl.textContent
          const id = btn.dataset.id

          // 显示加载状态
          loadingEl.textContent = '删除中...'
          btn.disabled = true

          try {
            const response = await axios.post(deleteApi, {
              ids: [id],
            })

            if (response.data.code === 0) {
              showSuccess('删除成功', {
                onConfirm: onSuccess,
              })
            } else {
              showError(response.data.msg || '删除失败')
            }
          } catch (error) {
            console.error('删除失败:', error)
            showError('删除失败，请稍后重试')
          } finally {
            // 恢复按钮状态
            loadingEl.textContent = originalText
            btn.disabled = false
          }
        })
      },

      /**
       * 处理批量删除
       * @param {Object} options - 配置项
       */
      handleBatchDelete(options) {
        const tableId = options.tableId
        const deleteApi = options.deleteApi
        const buttonId = options.buttonId
        const confirmMessage = options.confirmMessage
        const onSuccess = options.onSuccess
        const datatable = options.datatable

        const datatableEl = document.querySelector(tableId)
        if (!datatableEl) return

        const batchDeleteBtn = document.querySelector(buttonId)
        if (!batchDeleteBtn) return

        // 监听表格的选择变化
        document.addEventListener('change', function (e) {
          const checkbox = e.target.closest('[data-datatable-row-check="true"], [data-datatable-check="true"]')
          if (!checkbox) return

          // 使用setTimeout确保在checkbox状态更新后再获取选中的行
          setTimeout(() => {
            const checkedRows = datatable.getChecked()
            batchDeleteBtn.disabled = checkedRows.length === 0
          }, 0)
        })

        // 批量删除按钮点击事件
        batchDeleteBtn.addEventListener('click', async function () {
          const checkedRows = datatable.getChecked()
          if (checkedRows.length === 0) return

          const message = typeof confirmMessage === 'function' ? confirmMessage(checkedRows.length) : '确定要删除选中的 ' + checkedRows.length + ' 条记录吗？'
          console.log('message:', message)
          const confirmed = await showConfirm(message, {
            persistent: true,
            confirmText: '删除',
            cancelText: '取消',
          })
          if (!confirmed) {
            return
          }

          // 显示加载状态
          const originalText = this.textContent
          this.textContent = '删除中...'
          this.disabled = true

          try {
            const response = await axios.post(deleteApi, {
              ids: checkedRows,
            })

            if (response.data.code === 0) {
              showSuccess('批量删除成功', {
                onConfirm: onSuccess,
              })
            } else {
              showError(response.data.msg || '批量删除失败')
            }
          } catch (error) {
            console.error('批量删除失败:', error)
            showError('批量删除失败，请稍后重试')
          } finally {
            // 恢复按钮状态
            this.textContent = originalText
            this.disabled = false
          }
        })
      },

      /**
       * 处理表格筛选
       * @param {string} formSelector - 表单选择器
       * @param {Object} options - 配置项
       * @param {Object} datatable - 数据表格实例
       */
      handleTableFilter(formSelector, options, datatable) {
        const onSubmit = options.onSubmit
        const onReset = options.onReset

        const form = document.querySelector(formSelector)
        if (!form) return

        const resetBtn = document.getElementById('reset_filter_btn')

        // 处理表单提交
        form.addEventListener('submit', function (e) {
          e.preventDefault()
          // 重置表格状态，设置页码为1
          if (datatable) {
            datatable._config._state = {
              page: 1,
              pageSize: datatable.getState().pageSize,
              sortField: null,
              sortOrder: '',
              filters: [],
              search: '',
            }
          }
          if (onSubmit) onSubmit()
        })

        // 处理重置按钮点击
        if (resetBtn) {
          resetBtn.addEventListener('click', function () {
            // 重置所有表单元素
            form.querySelectorAll('input, select').forEach((element) => {
              if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = false
              } else {
                element.value = ''
              }
            })
            // 重置表格状态，设置页码为1
            if (datatable) {
              datatable._config._state = {
                page: 1,
                pageSize: datatable.getState().pageSize,
                sortField: null,
                sortOrder: '',
                filters: [],
                search: '',
              }
            }
            if (onReset) onReset()
          })
        }
      },

      /**
       * 获取表格当前所有参数
       * @param {Object} datatable - 数据表格实例
       * @returns {Object} 参数对象
       */
      getAllTableParams(datatable) {
        if (!datatable) return {}

        const form = document.querySelector('form')
        if (!form) return {}

        const formData = new FormData(form)
        const params = {}

        // 获取表单数据
        for (const [key, value] of formData.entries()) {
          if (value && typeof value === 'string') {
            const cleanValue = value.trim()
            params[key] = cleanValue ? encodeURIComponent(cleanValue) : ''
          }
        }

        // 添加分页信息
        const state = datatable.getState()
        if (state) {
          params.page = state.page || 1
          params.size = state.pageSize || 5
        }

        return params
      },

      /************************************************************************
       * 菜单处理
       ************************************************************************/

      /**
       * 处理左侧菜单的激活状态
       * 根据当前URL激活对应的菜单项
       */
      initMenuActive() {
        // 获取当前URL路径
        const currentPath = window.location.pathname

        // 获取所有菜单项
        const menuItems = document.querySelectorAll('.menu-item')

        menuItems.forEach((item) => {
          // 查找菜单项中的链接
          const link = item.querySelector('a.menu-link')
          if (!link) return

          // 获取链接的href属性
          const href = link.getAttribute('href')
          if (!href) return

          // 如果当前路径匹配菜单项的href
          if (currentPath === href || currentPath === '/' + href) {
            // 1. 为当前菜单项（子菜单）添加 active 类
            if (!item.classList.contains('menu-item-accordion')) {
              item.classList.add('active')
            }

            // 2. 处理所有父级菜单
            let parent = item.parentElement
            while (parent) {
              // 查找父级菜单项
              const parentMenuItem = parent.closest('.menu-item-accordion')
              if (!parentMenuItem) break

              // 为父级菜单添加必要的类
              parentMenuItem.classList.add('here', 'show')

              // 展开子菜单容器
              const accordion = parentMenuItem.querySelector('.menu-accordion')
              if (accordion) {
                accordion.classList.add('show')
              }

              // 继续向上查找
              parent = parentMenuItem.parentElement
            }
          }
        })

        // 处理菜单箭头的显示/隐藏（让它由 Tailwind 的类来控制）
        document.querySelectorAll('.menu-arrow').forEach((arrow) => {
          const menuItem = arrow.closest('.menu-item')
          if (menuItem && menuItem.classList.contains('show')) {
            const plusIcon = arrow.querySelector('.ki-plus')
            const minusIcon = arrow.querySelector('.ki-minus')
            if (plusIcon) plusIcon.classList.add('menu-item-show:hidden')
            if (minusIcon) minusIcon.classList.add('menu-item-show:inline-flex')
          }
        })
      },
    }
  }
}

// 导出工具类实例
window.Tools = new Tools()

/**
 * dayjs 常见用法示例：
 *
 * // 日期转时间戳
 * const timestampMs = dayjs('2019-06-12 12:30:10').valueOf(); // 毫秒
 * const timestampSec = dayjs('2019-06-12 12:30:10').unix(); // 秒
 *
 * // 时间戳(毫秒)转日期
 * const dateFromTimestamp = dayjs(1560313810687).format('YYYY-MM-DD HH:mm:ss');
 *
 * // 获取当月的天数
 * const daysInMonth = dayjs().daysInMonth();
 * const daysInFeb2012 = dayjs('2012-02', 'YYYY-MM').daysInMonth(); // 29
 *
 * // 转换
 * const dateArray = dayjs().toArray(); // [year, month, day, hour, minute, second, millisecond]
 * const dateObject = dayjs().toObject(); // { years, months, date, hours, minutes, seconds, milliseconds }
 *
 * // 比较
 * const isSameYear = dayjs('2010-10-20').isSame('2010-01-01', 'year'); // true
 * const isBefore = dayjs('2010-10-20').isBefore('2010-12-31', 'year'); // false
 * const isAfter = dayjs('2010-10-20').isAfter('2009-12-31', 'year'); // true
 * const isBetween = dayjs('2010-10-20').isBetween('2009-12-31', '2012-01-01', 'year'); // true
 */
