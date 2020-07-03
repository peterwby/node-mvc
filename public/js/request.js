layui.define(['Util'], function (exports) {
  var $ = layui.jquery,
    Util = layui.Util

  const request = {
    post: function (url, data = {}, options = {}) {
      options.data = data || {}
      options.headers = options.headers || {}
      options.url = url
      options.headers['token'] = options.headers['token'] || layui.data('a')['token'] || ''

      return $.ajax(
        $.extend(
          {
            type: 'post',
            dataType: 'json',
            xhrFields: { withCredentials: true },
            crossDomain: true,
            beforeSend: function (data) {
              if (!options.noload) {
                layer.load(2, { shade: [0.01, '#fff'] })
              }
            },
          },
          options
        )
      )
        .done(function (res) {
          //登录状态失效，清除本地 access_token，并强制跳转到登入页
          if (res.code === 1001) {
            logout()
          }
          //其它异常
          else if (res.code !== 0) {
            var error = ['<cite>错误：</cite> ' + (res.msg || '返回状态码异常')].join('')
            Util.msgFail(error)
          }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          var error = ['请求异常，请重试<br><cite>错误信息：</cite> 访问服务器时出错'].join('')
          Util.msgFail(error)
        })
        .always(function () {
          setTimeout(() => {
            layer.closeAll('loading')
          }, 500)
        })
    },
    get: function (url, data = {}, options = {}) {
      options.data = data || {}
      options.headers = options.headers || {}
      options.url = url
      options.headers['token'] = options.headers['token'] || layui.data('a')['token'] || ''

      return $.ajax(
        $.extend(
          {
            type: 'get',
            dataType: 'json',
            xhrFields: { withCredentials: true },
            crossDomain: true,
            beforeSend: function (data) {
              if (!options.noload) {
                layer.load(2, { shade: [0.01, '#fff'] })
              }
            },
          },
          options
        )
      )
        .done(function (res) {
          //登录状态失效，清除本地 access_token，并强制跳转到登入页
          if (res.code === 1001) {
            logout()
          }
          //其它异常
          else if (res.code !== 0) {
            var error = ['<cite>错误：</cite> ' + (res.msg || '返回状态码异常')].join('')
            Util.msgFail(error)
          }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          var error = ['请求异常，请重试<br><cite>错误信息：</cite> 访问服务器时出错'].join('')
          Util.msgFail(error)
        })
        .always(function () {
          setTimeout(() => {
            layer.closeAll('loading')
          }, 500)
        })
    },
    getOssToken: function (obj) {
      var url = config.serverUrl + 'oss/get-token'
      var data = {
        from: obj.from || 'web',
      }
      request.post(url, data, { async: false }).done(function (res) {
        if (res.code === 0) {
          data = res.data
        }
      })
      return data
    },
    uploadOss: function (obj, cb) {
      var osstoken = {}
      layui.upload.render({
        elem: obj.selector,
        field: 'file',
        auto: obj.auto || true,
        accept: obj.accept || 'file',
        acceptMime: obj.acceptMime || 'images',
        exts: obj.exts || 'jpg|png|gif|bmp|jpeg|eps',
        size: obj.size || 5096,
        dataType: 'text',
        before: function (obj) {
          osstoken = request.getOssToken({ from: obj.from })
          this.url = osstoken.host
          this.data = {
            key: osstoken.key,
            policy: osstoken.policy,
            OSSAccessKeyId: osstoken.OSSAccessKeyId,
            signature: osstoken.signature,
            success_action_status: osstoken.success_action_status || 200,
          }
        },
        done: function (res, index, upload) {
          Util.msgOk('上传成功')
          if (typeof cb === 'function') {
            var ossurl = osstoken.host + '/' + osstoken.key
            cb({ url: ossurl })
          }
        },
        error: function (index, upload) {
          Util.msgFail('上传失败')
        },
      })
    },
  }

  const logout = function () {
    //清空本地记录的 token
    layui.data('a', {
      key: 'token',
      remove: true,
    })

    //跳转到登入页
    location.href = '/'
  }

  exports('request', request)
})
