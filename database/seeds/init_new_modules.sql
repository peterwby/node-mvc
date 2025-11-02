-- ============================================================
-- 新模块统一SQL文件
-- 包含：表结构、权限、菜单等
-- ============================================================
-- 1. 系统配置表（如果已存在可跳过）
CREATE TABLE IF NOT EXISTS `system_config` (
  `config_id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL COMMENT '配置键名',
  `config_value` text COMMENT '配置值',
  `config_type` varchar(20) DEFAULT 'text' COMMENT '配置类型: text/image/url/color/boolean',
  `config_group` varchar(50) DEFAULT 'basic' COMMENT '配置分组',
  `description` varchar(255) DEFAULT NULL COMMENT '配置描述',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '系统配置表';

-- 初始化系统配置数据
INSERT
  IGNORE INTO `system_config` (
    `config_key`,
    `config_value`,
    `config_type`,
    `config_group`,
    `description`
  )
VALUES
  (
    'system_name',
    'Chanson Management',
    'text',
    'basic',
    '系统名称'
  ),
  (
    'system_description',
    'Chanson Management',
    'text',
    'basic',
    '系统描述'
  ),
  (
    'logo_url',
    '/assets/images/logo.png',
    'image',
    'appearance',
    '系统Logo图片路径'
  ),
  (
    'footer_year',
    '2025',
    'text',
    'appearance',
    '版权年份'
  ),
  (
    'footer_company_name',
    'Chanson Inc.',
    'text',
    'appearance',
    '版权公司名称'
  ),
  (
    'footer_company_url',
    'https://keenthemes.com',
    'url',
    'appearance',
    '版权公司链接'
  ),
  (
    'login_bg_image',
    '/assets/media/images/2600x1200/bg-10.png',
    'image',
    'appearance',
    '登录页背景图 (浅色模式)'
  ),
  (
    'login_bg_image_dark',
    '/assets/media/images/2600x1200/bg-10-dark.png',
    'image',
    'appearance',
    '登录页背景图 (深色模式)'
  ),
  (
    'theme_primary_color',
    '#1B84FF',
    'color',
    'appearance',
    '主题主色'
  ),
  (
    'theme_secondary_color',
    '#F9F9F9',
    'color',
    'appearance',
    '主题副色'
  ),
  (
    'upload_max_size',
    '10485760',
    'number',
    'upload',
    '上传文件大小限制 (字节)'
  ),
  (
    'maintenance_mode',
    '0',
    'boolean',
    'system',
    '系统维护模式开关 (0:关闭, 1:开启)'
  ),
  (
    'maintenance_message',
    '系统正在维护，请稍后再试。',
    'text',
    'system',
    '维护模式提示信息'
  );

-- 2. member表添加avatar字段
-- 注意：如果字段已存在会报错，可以忽略或先检查
ALTER TABLE
  `member`
ADD
  COLUMN `avatar` varchar(500) DEFAULT NULL COMMENT '头像路径'
AFTER
  `email`;

-- 3. 文件管理表
CREATE TABLE IF NOT EXISTS `files` (
  `file_id` int(11) NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL COMMENT '原始文件名',
  `file_path` varchar(500) NOT NULL COMMENT '文件存储路径',
  `file_size` bigint(20) DEFAULT NULL COMMENT '文件大小（字节）',
  `file_type` varchar(50) DEFAULT NULL COMMENT '文件类型（MIME类型）',
  `file_ext` varchar(20) DEFAULT NULL COMMENT '文件扩展名',
  `category` varchar(50) DEFAULT 'other' COMMENT '文件分类：image/document/video/audio/other',
  `upload_by` int(11) DEFAULT NULL COMMENT '上传者ID',
  `description` text COMMENT '文件描述',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`file_id`),
  KEY `idx_category` (`category`),
  KEY `idx_upload_by` (`upload_by`),
  KEY `idx_created_at` (`created_at`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '文件管理表';

-- 4. 系统公告表
CREATE TABLE IF NOT EXISTS `notices` (
  `notice_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT '公告标题',
  `content` text COMMENT '公告内容',
  `type` enum('info', 'warning', 'success', 'error') DEFAULT 'info' COMMENT '公告类型',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0-未发布，1-已发布',
  `is_top` tinyint(1) DEFAULT 0 COMMENT '是否置顶：0-否，1-是',
  `publish_time` datetime DEFAULT NULL COMMENT '发布时间',
  `expire_time` datetime DEFAULT NULL COMMENT '过期时间',
  `publish_by` int(11) DEFAULT NULL COMMENT '发布人ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`notice_id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_top` (`is_top`),
  KEY `idx_publish_time` (`publish_time`),
  KEY `idx_publish_by` (`publish_by`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '系统公告表';

-- ============================================================
-- 权限配置（permissions表）
-- ============================================================
-- 注意：字段名与permissions表结构对应：name, key, type, description
-- 系统配置管理权限
INSERT
  IGNORE INTO `permissions` (`name`, `key`, `type`, `description`)
VALUES
  (
    '系统配置管理-查看',
    '/admin/system-config/edit',
    'menu',
    '系统配置管理页面查看权限'
  );

-- 个人中心权限（通常不需要额外权限，所有登录用户都可访问）
-- 文件管理权限
INSERT
  IGNORE INTO `permissions` (`name`, `key`, `type`, `description`)
VALUES
  (
    '文件管理-查看',
    '/admin/files/list',
    'menu',
    '文件管理列表查看权限'
  ),
  (
    '文件管理-上传',
    '/admin/files/list@upload',
    'element',
    '文件上传权限'
  ),
  (
    '文件管理-删除',
    '/admin/files/list@remove',
    'element',
    '文件删除权限'
  );

-- 系统公告管理权限
INSERT
  IGNORE INTO `permissions` (`name`, `key`, `type`, `description`)
VALUES
  (
    '系统公告-查看',
    '/admin/notices/list',
    'menu',
    '系统公告列表查看权限'
  ),
  (
    '系统公告-创建',
    '/admin/notices/list@create',
    'element',
    '创建公告权限'
  ),
  (
    '系统公告-编辑',
    '/admin/notices/list@edit',
    'element',
    '编辑公告权限'
  ),
  (
    '系统公告-删除',
    '/admin/notices/list@remove',
    'element',
    '删除公告权限'
  );

-- ============================================================
-- 菜单配置（primary_menus表）
-- ============================================================
-- 字段说明：
-- id: 主键（自增）
-- parent_id: 父菜单ID（0表示顶级菜单，其他数字表示父菜单的id）
-- title: 英文标题
-- title_cn: 中文标题
-- icon: 图标类名（可为NULL）
-- url: URL路径（可为NULL，父菜单通常为NULL）
-- sort: 排序（整数，数字越小越靠前）
-- level: 层级（1=顶级，2=子级）
-- is_leaf: 是否叶子节点（0=否/有子菜单，1=是/无子菜单）
-- spread: 是否展开（可为NULL，0=否，1=是）
-- status: 状态（1=启用，0=禁用）
-- created_at, updated_at: 时间戳
-- 文件管理菜单（顶级菜单）
INSERT
  IGNORE INTO `primary_menus` (
    `title`,
    `title_cn`,
    `url`,
    `parent_id`,
    `sort`,
    `icon`,
    `level`,
    `is_leaf`,
    `status`
  )
VALUES
  (
    'Files Management',
    '文件管理',
    '/admin/files/list',
    0,
    10,
    'ki-filled ki-file',
    1,
    1,
    1
  );

-- 系统公告菜单（顶级菜单）
INSERT
  IGNORE INTO `primary_menus` (
    `title`,
    `title_cn`,
    `url`,
    `parent_id`,
    `sort`,
    `icon`,
    `level`,
    `is_leaf`,
    `status`
  )
VALUES
  (
    'Notices Management',
    '系统公告',
    '/admin/notices/list',
    0,
    10,
    'ki-filled ki-notification',
    1,
    1,
    1
  );

-- 系统配置菜单（通常在系统设置下）
-- 如果已经有系统设置菜单（假设parent_id=某个已存在的菜单ID），可以这样插入：
-- 注意：根据实际情况调整parent_id的值，如果找不到合适的父菜单，parent_id设为0作为顶级菜单
INSERT
  IGNORE INTO `primary_menus` (
    `title`,
    `title_cn`,
    `url`,
    `parent_id`,
    `sort`,
    `icon`,
    `level`,
    `is_leaf`,
    `status`
  )
VALUES
  (
    'System Config',
    '系统配置',
    '/admin/system-config/edit',
    0,
    10,
    'ki-filled ki-setting-2',
    1,
    1,
    1
  );

-- ============================================================
-- 注意：
-- 1. 所有表创建都使用了 IF NOT EXISTS，重复执行不会报错
-- 2. 权限和菜单插入使用了 INSERT IGNORE，避免重复插入
-- 3. parent_id需要根据实际的菜单结构进行调整
-- 4. 执行前请先备份数据库
-- ============================================================
