const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class RolesTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'roles',
      primary_key: 'role_id',
      fields: {
        role_id: {
          type: 'int',
          primary: true,
          auto_increment: true,
        },
        name: {
          type: 'string',
          length: 50,
          nullable: false,
          comment: 'name',
        },
        description: {
          type: 'string',
          length: 255,
          nullable: true,
          comment: '描述',
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
   * 获取关联信息
   * @example
   * fetchDetailById(id)
   */
  async fetchDetailById(id) {
    try {
      let result = await Database.select(
        'a.role_id',
        'a.name',
        'a.description',
        'a.created_at',
        'a.updated_at',
        Database.raw('COUNT(DISTINCT b.member_id) as member_count') // 添加成员数量统计
      )
        .from('roles as a')
        .leftJoin('member_roles as b', 'a.role_id', 'b.role_id') // 添加左连接
        .where('a.role_id', id)
        .groupBy('a.role_id', 'a.name', 'a.description', 'a.created_at', 'a.updated_at') // 添加分组
        .orderBy('a.role_id', 'desc')
      let data = result[0] || {}
      return Util.end({
        data,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        data: { table: this.tableName },
        track: 'table_fetchDetailById_1586339053',
      })
    }
  }

  /**
   * 列表信息
   * @example
   * fetchListBy({ role_name, page, limit })
   */
  async fetchListBy(obj) {
    try {
      let result = {}
      const table = Database.clone()
      table
        .select(
          'a.role_id',
          'a.name',
          'a.description',
          'a.created_at',
          'a.updated_at',
          Database.raw('COUNT(DISTINCT b.member_id) as member_count') // 添加成员数量统计
        )
        .from('roles as a')
        .leftJoin('member_roles as b', 'a.role_id', 'b.role_id') // 添加左连接
        .groupBy('a.role_id', 'a.name', 'a.description', 'a.created_at', 'a.updated_at') // 添加分组
        .orderBy('a.role_id', 'desc')

      if (obj.role_name) {
        table.where('a.name', 'like', `%${obj.role_name}%`)
      }
      result = await table.paginate(obj.page, obj.limit)
      return Util.end({
        data: result,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        data: { table: this.tableName },
        track: 'fetchListBy_1581552645',
      })
    }
  }
}

module.exports = RolesTable
