-- 插入权限数据
INSERT INTO
  permissions (name, type, `key`, description)
VALUES
  -- 菜单权限
  ('首页', 'menu', '/admin/', '首页'),
  (
    '会员列表',
    'menu',
    '/admin/member/list',
    '会员管理-列表页面'
  ),
  (
    '会员查看',
    'menu',
    '/admin/member/view/:id',
    '会员管理-查看页面'
  ),
  (
    '会员编辑',
    'menu',
    '/admin/member/edit/:id',
    '会员管理-编辑页面'
  ),
  (
    '会员创建',
    'menu',
    '/admin/member/create',
    '会员管理-创建页面'
  ),
  -- API权限
  (
    '获取会员列表',
    'api',
    '/api/member/get-list',
    '获取会员列表数据'
  ),
  (
    '创建会员',
    'api',
    '/api/member/create-info',
    '创建新会员'
  ),
  (
    '更新会员',
    'api',
    '/api/member/update-info',
    '更新会员信息'
  ),
  ('删除会员', 'api', '/api/member/remove', '删除会员'),
  (
    '更新密码',
    'api',
    '/api/member/update-password',
    '更新会员密码'
  ),
  -- 元素权限
  (
    '编辑按钮',
    'element',
    '/admin/member/list@edit',
    '会员列表中的编辑按钮'
  ),
  (
    '删除按钮',
    'element',
    '/admin/member/list@remove',
    '会员列表中的删除按钮'
  ),
  (
    '创建按钮',
    'element',
    '/admin/member/list@create',
    '会员列表中的创建按钮'
  ),
  (
    '批量删除按钮',
    'element',
    '/admin/member/list@batch-remove',
    '会员列表中的批量删除按钮'
  );

-- 插入角色数据
INSERT INTO
  roles (name, description)
VALUES
  ('超级管理员', '系统超级管理员，拥有所有权限'),
  ('普通管理员', '普通管理员，拥有部分权限');

-- 为超级管理员分配所有权限
INSERT INTO
  role_permissions (role_id, permission_id)
SELECT
  1,
  permission_id
FROM
  permissions;

-- 为普通管理员分配部分权限
INSERT INTO
  role_permissions (role_id, permission_id)
SELECT
  2,
  permission_id
FROM
  permissions
WHERE
  type IN ('menu', 'api')
  AND `key` NOT IN (
    '/api/member/remove',
    '/api/member/update-password'
  );
