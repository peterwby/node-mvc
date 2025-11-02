const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class SystemConfigTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'system_config',
      primary_key: 'config_id',
      fields: {
        config_id: {
          type: 'int',
          primary: true,
          auto_increment: true,
        },
        config_key: {
          type: 'string',
          length: 100,
          nullable: false,
          unique: true,
          comment: '配置键名',
        },
        config_value: {
          type: 'string',
          nullable: true,
          comment: '配置值',
        },
        config_type: {
          type: 'string',
          length: 20,
          nullable: false,
          default: 'text',
          comment: '配置类型',
        },
        config_group: {
          type: 'string',
          length: 50,
          nullable: false,
          default: 'basic',
          comment: '配置分组',
        },
        description: {
          type: 'string',
          length: 255,
          nullable: true,
          comment: '配置描述',
        },
        created_at: {
          type: 'datetime',
          nullable: true,
          default: 'CURRENT_TIMESTAMP',
        },
        updated_at: {
          type: 'datetime',
          nullable: true,
          default: 'CURRENT_TIMESTAMP',
          on_update: 'CURRENT_TIMESTAMP',
        },
      },
    }
    super(data)
  }

  /**
   * 根据key获取配置
   * @example
   * getByKey('logo_url')
   */
  async getByKey(key) {
    try {
      const result = await Database.select('*').from(this.tableName).where('config_key', key).first()
      return Util.end({
        data: result || null,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'table_getByKey_1739012356882',
      })
    }
  }

  /**
   * 获取所有配置
   * @example
   * getAllConfigs()
   */
  async getAllConfigs() {
    try {
      const result = await Database.select('*').from(this.tableName).orderBy('config_group', 'asc').orderBy('config_id', 'asc')
      return Util.end({
        data: result || [],
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'table_getAllConfigs_1739012356882',
      })
    }
  }

  /**
   * 按分组获取配置
   * @example
   * getByGroup('appearance')
   */
  async getByGroup(group) {
    try {
      const result = await Database.select('*').from(this.tableName).where('config_group', group).orderBy('config_id', 'asc')
      return Util.end({
        data: result || [],
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'table_getByGroup_1739012356882',
      })
    }
  }

  /**
   * 根据key更新配置值
   * @example
   * updateByKey('logo_url', '/new/path/logo.png')
   */
  async updateByKey(key, value) {
    try {
      const result = await Database.table(this.tableName).where('config_key', key).update({
        config_value: value,
      })
      return Util.end({
        data: {
          affected: result,
        },
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'table_updateByKey_1739012356882',
      })
    }
  }
}

module.exports = SystemConfigTable
