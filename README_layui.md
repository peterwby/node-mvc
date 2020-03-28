### 后端模板 结合 layui 单页面 beta

- src/views 复制到 nodejs 的 resources/views，并把 html 改为 edge
- src 目录下其他所有文件都复制到 nodejs 的 public 目录下
- 修改 routes.js
  ```
  Route.any('/', ({ view }) => view.render('admin.index'))
  Route.get('*', ({ view, params, request }) => {
  const url = request.url()
  let tpl_src = url.replace(/\//g, '.')
  if (tpl_src.endsWith('.edge')) {
      tpl_src = tpl_src.substring(0, tpl_src.lastIndexOf('.edge'))
  }
  return view.render('admin' + tpl_src)
  })
  ```
- layui 的 layout.js 里，所有代码外面，包住@raw @endraw
