-- 系统配置表与初始数据

CREATE TABLE IF NOT EXISTS `system_config` (
  `config_id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL COMMENT '配置键名',
  `config_value` text COMMENT '配置值',
  `config_type` varchar(20) DEFAULT 'text' COMMENT '配置类型：text/image/url/number/boolean/color',
  `config_group` varchar(50) DEFAULT 'basic' COMMENT '配置分组：basic/appearance/upload/system',
  `description` varchar(255) DEFAULT NULL COMMENT '配置描述',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

INSERT INTO `system_config` (`config_key`, `config_value`, `config_type`, `config_group`, `description`) VALUES
('logo_url', '/assets/images/logo.png', 'image', 'appearance', '系统Logo图片路径'),
('footer_year', '2025', 'text', 'appearance', '版权年份'),
('footer_company_name', 'Chanson Inc.', 'text', 'appearance', '版权公司名称'),
('footer_company_url', 'https://keenthemes.com', 'url', 'appearance', '版权公司链接'),
('system_name', 'Chanson Management', 'text', 'basic', '系统名称'),
('system_description', 'Chanson Management', 'text', 'basic', '系统描述'),
('login_bg_image', '/assets/media/images/2600x1200/bg-10.png', 'image', 'appearance', '登录页背景图（浅色模式）'),
('login_bg_image_dark', '/assets/media/images/2600x1200/bg-10-dark.png', 'image', 'appearance', '登录页背景图（深色模式）'),
('upload_max_size', '10485760', 'number', 'upload', '上传文件大小限制（字节，默认10MB）'),
('maintenance_mode', '0', 'boolean', 'system', '系统维护模式：0-关闭 1-开启'),
('maintenance_message', '系统维护中，请稍后再试', 'text', 'system', '维护模式提示信息'),
('theme_primary_color', '#009EF7', 'color', 'appearance', '主题主色'),
('theme_secondary_color', '#7239EA', 'color', 'appearance', '主题次色')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);


