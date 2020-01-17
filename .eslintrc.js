module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  extends: 'eslint:recommended',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    // 禁止出现未使用过的变量
    'no-unused-vars': 0,
    // 禁止条件表达式中出现赋值操作符
    'no-cond-assign': 2,
    // 禁止 function 定义中出现重名参数
    'no-dupe-args': 2,
    // 禁止对象字面量中出现重复的 key
    'no-dupe-keys': 2,
    // 禁止重复的 case 标签
    'no-duplicate-case': 2,
    // 禁止对 function 声明重新赋值
    'no-func-assign': 2,
    // 禁止在嵌套的块中出现 function 或 var 声明
    'no-inner-declarations': 0,
    // 禁止不必要的布尔转换
    'no-extra-boolean-cast': 1,
    // 禁止直接使用 Object.prototypes 的内置属性
    'no-prototype-builtins': 0,
    // 禁用不必要的转义字符
    'no-useless-escape': 0,
    // 强制使用一致的换行风格
    'linebreak-style': [1, 'unix'],
  },
  globals: {
    use: null,
  },
}
