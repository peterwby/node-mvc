# Node.js 后台框架培训教程

## 一、环境准备

### 1.1 安装开发环境

1. 克隆项目到本地

```bash
git clone https://gitee.com/sh-chanson/node-server.git -b tutorial
cd node-server
```

2. 运行安装脚本

```bash
chmod +x setup.sh
./setup.sh
```

### 1.2 验证安装

运行开发服务器：

```bash
pnpm dev
```

如果能看到服务启动成功的信息，说明环境已经准备就绪。

## 二、从 PHP 到 Node.js 核心概念

在开始之前，强烈推荐先学习 JavaScript 基础知识：

- [现代 JavaScript 教程](https://zh.javascript.info/) - 一个从基础到高级的 JavaScript 完整教程，内容全面且现代化，有在线练习，适合新手入门。

### 2.1 异步编程

PHP vs Node.js 的主要区别在于异步编程模型：

1. PHP 同步代码：

```php
$result = DB::table('users')->where('user_id', 1)->get();
echo $result;
```

2. Node.js 异步代码：

```javascript
const result = await Database.select('*').from('users').where('user_id', 1)
console.log(result)
```

### 2.2 基础语法对比

1. 变量声明：

```php
// PHP
$name = "test";              // 字符串
$age = 18;                   // 整数
$price = 10.5;              // 浮点数
$is_active = true;          // 布尔值
$items = array();           // 数组
$items = [];                // 数组（简写）
```

```javascript
// Node.js
const name = 'test' // 字符串（不可变）
let age = 18 // 整数（可变）
let price = 10.5 // 浮点数
let isActive = true // 布尔值
let items = [] // 数组
```

2. 数组操作：

```php
// PHP
$array = [1, 2, 3];
$array[] = 4;                          // 添加元素
array_push($array, 5);                 // 添加元素
$first = $array[0];                    // 获取元素
$length = count($array);               // 数组长度
$filtered = array_filter($array,       // 过滤数组
    function($item) {
        return $item > 2;
    }
);
$mapped = array_map(function($item) {  // 映射数组
    return $item * 2;
}, $array);
```

```javascript
// Node.js
const array = [1, 2, 3]
array.push(4) // 添加元素
const first = array[0] // 获取元素
const length = array.length // 数组长度
const filtered = array.filter(
  // 过滤数组
  (item) => item > 2
)
const mapped = array.map(
  // 映射数组
  (item) => item * 2
)
```

3. 对象/关联数组：

```php
// PHP（关联数组）
$user = [
    'name' => 'test',
    'age' => 18
];
$name = $user['name'];            // 获取值
$user['email'] = 'test@test.com'; // 设置值
```

```javascript
// Node.js（对象）
const user = {
  name: 'test',
  age: 18,
}
const name = user.name // 获取值（点号）
const age = user['age'] // 获取值（方括号）
user.email = 'test@test.com' // 设置值
```

## 三、框架使用教程

### 3.1 路由配置 (Router)

文件位置：`start/routes.js`

```javascript
Route.group(() => {
  Route.get('user-info', 'PC/UserController.getInfo')
  Route.post('update-user', 'PC/UserController.update')
}).prefix('api/v1')
```

### 3.2 控制器 (Controller)

文件位置：`app/Controllers/Http/PC/UserController.js`

```javascript
const { validate } = use('Validator')
const Util = require('@Lib/Util')
const UserService = require('@Services/UserService')
const userService = new UserService()

class UserController {
  async create({ request }) {
    try {
      // 检查参数合法性
      const resultValid = await createValid({ request })
      if (resultValid) return resultValid

      // 调用业务逻辑Service
      const result = await userService.createUser(request.body)

      // 返回结果
      return Util.end2front({
        msg: '创建成功',
        data: result,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_create_1234567',
      })
    }
  }
}

// 参数验证函数
async function createValid({ request }) {
  try {
    // 组装处理参数
    await paramsHandle()
    // 校验请求参数合法性
    await paramsValid()
    return null

    async function paramsHandle() {
      const requestAll = request.all()
      let body = {}
      for (let k in requestAll) {
        switch (k.toLowerCase()) {
          case 'username':
            body.username = requestAll[k]
            break
          case 'email':
            body.email = requestAll[k]
            break
        }
      }
      request.body = Util.deepClone(body)
    }

    async function paramsValid() {
      const rules = {
        username: 'required|min:2|max:20',
        email: 'required|email',
      }
      const messages = {
        'username.required': '用户名为必填项',
        'username.min': '用户名最少2个字符',
        'username.max': '用户名最多20个字符',
        'email.required': '邮箱为必填项',
        'email.email': '邮箱格式不正确',
      }
      const validation = await validate(request.body, rules, messages)
      if (validation.fails()) {
        throw new Error(validation.messages()[0].message)
      }
    }
  } catch (err) {
    return Util.error2front({
      isShowMsg: true,
      msg: err.message,
      code: 9000,
      track: 'valid_createValid_1234567',
    })
  }
}
```

### 3.3 服务层 (Service)

文件位置：`app/Services/UserService.js`

```javascript
const Database = use('Database')
const BaseService = require('@BaseClass/BaseService')
const UserTable = require('@Table/user')
const userTable = new UserTable()

class UserService extends BaseService {
  async createUser(data) {
    return await Database.transaction(async (trx) => {
      try {
        // 创建用户
        const user = await userTable.create(data, trx)

        // 创建用户默认设置
        await userSettingTable.create(
          {
            user_id: user.user_id,
            theme: 'light',
            language: 'zh-CN',
          },
          trx
        )

        return user
      } catch (err) {
        throw err
      }
    })
  }

  async updateUser(user_id, data) {
    return await Database.transaction(async (trx) => {
      try {
        return await userTable.update(user_id, data, trx)
      } catch (err) {
        throw err
      }
    })
  }
}
```

### 3.4 数据模型 (Model)

文件位置：`app/Models/Table/user.js`

```javascript
const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class UserTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'user',
      primary_key: 'user_id',
    }
    super(data)
  }

  /**
   * 创建用户
   * @param {Object} data 用户数据
   * @param {Object} trx 事务对象
   */
  async create(data, trx) {
    const query = trx ? trx : Database
    return await query.table(this.table_name).insert(data)
  }

  /**
   * 更新用户信息
   * @param {number} user_id 用户ID
   * @param {Object} data 更新数据
   * @param {Object} trx 事务对象
   */
  async update(user_id, data, trx) {
    const query = trx ? trx : Database
    return await query.table(this.table_name).where(this.primary_key, user_id).update(data)
  }
}

module.exports = UserTable
```

## 四、实战练习

### 4.1 创建用户模块 API

1. 创建路由

```javascript
// start/routes.js
Route.group(() => {
  Route.post('create-user', 'PC/UserController.create')
  Route.get('get-user', 'PC/UserController.getInfo')
  Route.post('update-user', 'PC/UserController.update')
  Route.post('delete-user', 'PC/UserController.delete')
}).prefix('api/v1')
```

2. 实现控制器方法

```javascript
// UserController.js
const { validate } = use('Validator')
const Util = require('@Lib/Util')
const UserService = require('@Services/UserService')
const userService = new UserService()

class UserController {
  async create({ request }) {
    try {
      // 检查参数合法性
      const resultValid = await createValid({ request })
      if (resultValid) return resultValid

      // 调用业务逻辑Service
      const result = await userService.createUser(request.body)

      return Util.end2front({
        msg: '创建成功',
        data: result,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_create_1234567',
      })
    }
  }

  async update({ request }) {
    try {
      const user_id = request.input('user_id')
      const data = request.only(['username', 'email'])

      const result = await userService.updateUser(user_id, data)

      return Util.end2front({
        msg: '更新成功',
        data: result,
      })
    } catch (err) {
      return Util.error2front({
        msg: err.message,
        track: 'controller_update_1234567',
      })
    }
  }
}
```

3. 实现服务层方法

```javascript
// UserService.js
class UserService extends BaseService {
  async createUser(data) {
    return await Database.transaction(async (trx) => {
      try {
        // 创建用户
        const user = await userTable.create(data, trx)

        // 创建用户默认设置
        await userSettingTable.create(
          {
            user_id: user.user_id,
            theme: 'light',
            language: 'zh-CN',
          },
          trx
        )

        return user
      } catch (err) {
        throw err
      }
    })
  }

  async updateUser(user_id, data) {
    return await Database.transaction(async (trx) => {
      try {
        return await userTable.update(user_id, data, trx)
      } catch (err) {
        throw err
      }
    })
  }
}
```

### 4.2 Redis 缓存使用

```javascript
// UserService.js
const Redis = use('Redis')

class UserService extends BaseService {
  async getUserInfo(user_id) {
    // 缓存键名
    const cache_key = `user:${user_id}`

    try {
      // 先从缓存获取
      const cached = await Redis.get(cache_key)
      if (cached) {
        return JSON.parse(cached)
      }

      // 缓存不存在，从数据库获取
      const user = await userTable.findOne(user_id)
      if (user) {
        // 设置缓存，1小时过期
        await Redis.set(cache_key, JSON.stringify(user), 'EX', 3600)
      }
      return user
    } catch (err) {
      log.error('获取用户信息失败:', err)
      throw err
    }
  }
}
```

### 4.3 异步任务处理

```javascript
// UserService.js
const Mail = use('Mail')
const log = use('Logger')

class UserService extends BaseService {
  async sendWelcomeEmail(user) {
    try {
      // 异步发送邮件
      await Mail.send('emails.welcome', user, (message) => {
        message.to(user.email).from('support@example.com').subject('欢迎注册我们的服务')
      })

      // 记录发送成功日志
      log.info('欢迎邮件发送成功', {
        user_id: user.user_id,
        email: user.email,
      })
    } catch (error) {
      // 记录错误日志
      log.error('发送欢迎邮件失败:', error, {
        user_id: user.user_id,
        email: user.email,
      })
      throw error
    }
  }
}
```

## 五、开发规范

### 5.1 命名规范

- 类名：使用 PascalCase（如：`UserController`）
- 函数名：使用 camelCase（如：`getUserInfo`）
- 路由/URL：使用连字符（如：`get-user-info`）
- 文件名：使用下划线（如：`user_controller.js`）
- 变量名/JSON 键：使用下划线（如：`user_info`）

## 常见问题

1. 启动失败

- 检查 Redis 是否正常运行
- 检查 .env 配置是否正确
- 检查端口是否被占用

2. 数据库连接失败

- 检查数据库配置
- 确保数据库服务正常运行

3. 路由未生效

- 检查路由文件语法
- 确认控制器文件存在且路径正确

如有其他问题，请查看项目文档或咨询开发团队。
