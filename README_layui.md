### layui 封装第三方插件

```bash
layui.define(function(exports){ //提示：组件也可以依赖其它组件，如：layui.define('jquery', callback);
  //插件内容
  //输出test接口
  exports('test');
});

//如果有依赖的css则是
layui.define(function(exports){
  //插件内容
  //输出test接口
  exports('test');
}).addcss('css相对于这个js的路径');

//调用
layui.config({
  base: '/res/js/' //假设这是test.js所在的目录   可以把你需要扩展的js插件都放在一个文件夹内
}).extend({ //设定组件别名
  test: 'test'
});

//使用test
layui.use('test', function(){
  var test = layui.test;
  //插件的调用  有依赖就加依赖，比如jq
});
```
