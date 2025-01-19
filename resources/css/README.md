# CSS 资源目录

本目录包含项目的 CSS 入口文件和相关资源。

## 文件说明

### app.css

这是项目的主要 CSS 入口文件，由 Tailwind CLI 处理并编译到 `public/assets/css/app.css`。

文件结构：

```css
/* Keenicons */
@import '../metronic/vendors/keenicons/duotone/style.css';
@import '../metronic/vendors/keenicons/filled/style.css';
@import '../metronic/vendors/keenicons/outline/style.css';
@import '../metronic/vendors/keenicons/solid/style.css';

/* Metronic styles (includes Tailwind and demo1) */
@import '../metronic/css/styles.css';

/* Your custom styles below */
```

### 说明：

1. 图标样式：导入 Metronic 的 Keenicons 图标样式
2. 主样式：导入 Metronic 的主样式文件，它包含了：
   - Tailwind 的基础样式
   - Metronic 的组件样式
   - Demo1 主题的特定样式
3. 自定义样式：可以在文件末尾添加项目特定的样式

### 构建命令：

- 开发环境：`pnpm css:watch` (通过 `pnpm dev` 自动运行)
- 生产环境：`pnpm css:prod` (通过 `pnpm start` 自动运行)
- 单次构建：`pnpm css:build`
