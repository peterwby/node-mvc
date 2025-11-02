-- 文件管理表
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
