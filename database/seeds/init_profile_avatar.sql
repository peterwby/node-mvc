-- 为member表添加avatar字段（如果不存在）
-- 检查字段是否存在，如果不存在则添加
-- 注意：某些MySQL版本不支持IF NOT EXISTS，如果执行失败请手动检查字段是否存在
ALTER TABLE
  `member`
ADD
  COLUMN `avatar` varchar(500) DEFAULT NULL COMMENT '头像路径'
AFTER
  `email`;

-- 如果字段已存在，上面的语句会报错，可以忽略
