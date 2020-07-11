var config = {
  server_url: 'http://127.0.0.1:3000/api/v1/', //接口服务器地址
  front_url: location.origin + '/html/',
  table_limit: 20,
  is_dev_env: true,
}
//加载后运行
!(function () {
  init() //初始化
})()

/********************************** */

function getByEnv(dev, prod) {
  return window.location.host.indexOf('127.0.0.1') !== -1 ? dev : prod
}

function init() {
  //设置插件位置
  layui
    .config({
      base: '/js/', //假设这是你存放拓展模块的根目录
    })
    .extend({
      //设定模块别名
      request: 'request',
      Util: 'Util',
      dayjs: 'dayjs', //时间工具
      xmSelect: 'xmSelect', //加强版下拉框
      layarea: 'layarea', //省市联动
    })
  //设置表格全局参数
  layui.table.set({
    method: 'post',
    contentType: 'application/json',
    headers: {
      token: layui.data('a').token || '',
    },
    parseData: function (res) {
      //res 即为原始返回的数据
      return {
        code: res.code, //解析接口状态
        msg: res.msg, //解析提示文本
        count: res.total, //解析数据长度
        data: res.data, //解析数据列表
      }
    },
    loading: false,
    page: true,
    limit: config.table_limit,
    text: {
      none: '暂无相关信息',
    },
  })

  //生产环境关闭console
  if (!config.is_dev_env) {
    console.log = () => {}
  }
}
