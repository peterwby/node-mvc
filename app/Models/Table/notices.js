const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class NoticesTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'notices',
      primary_key: 'notice_id',
      fields: {
        notice_id: {
          type: 'int',
          primary: true,
          auto_increment: true,
        },
        title: {
          type: 'string',
          length: 255,
          nullable: false,
          comment: '公告标题',
        },
        content: {
          type: 'string',
          nullable: true,
          comment: '公告内容',
        },
        type: {
          type: 'enum',
          values: ['info', 'warning', 'success', 'error'],
          nullable: false,
          default: 'info',
          comment: '公告类型',
        },
        status: {
          type: 'int',
          nullable: false,
          default: 1,
          comment: '状态',
        },
        is_top: {
          type: 'int',
          nullable: false,
          default: 0,
          comment: '是否置顶',
        },
        publish_time: {
          type: 'datetime',
          nullable: true,
          comment: '发布时间',
        },
        expire_time: {
          type: 'datetime',
          nullable: true,
          comment: '过期时间',
        },
        publish_by: {
          type: 'int',
          nullable: true,
          comment: '发布人ID',
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
   * 获取公告列表
   * @example
   * fetchListBy({ status, is_top, search, page, limit })
   */
  async fetchListBy(obj) {
    try {
      let result = {}
      const table = Database.clone()
      table
        .select('a.*', 'b.nickname as publisher_name')
        .from('notices as a')
        .leftJoin('member as b', 'a.publish_by', 'b.member_id')
        .orderBy('a.is_top', 'desc')
        .orderBy('a.publish_time', 'desc')
        .orderBy('a.created_at', 'desc')

      if (obj.status !== undefined && obj.status !== '') {
        table.where('a.status', obj.status)
      }

      if (obj.is_top !== undefined && obj.is_top !== '') {
        table.where('a.is_top', obj.is_top)
      }

      if (obj.search) {
        table.where((builder) => {
          builder.where('a.title', 'like', `%${obj.search}%`)
          builder.orWhere('a.content', 'like', `%${obj.search}%`)
        })
      }

      result = await table.paginate(obj.page || 1, obj.limit || 20)
      return Util.end({
        data: result,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        data: { table: this.tableName },
        track: 'fetchListBy_1739012356882',
      })
    }
  }

  /**
   * 获取有效公告（用于前台展示）
   */
  async getActiveNotices() {
    try {
      const now = new Date()
      const result = await Database.select('*')
        .from(this.tableName)
        .where('status', 1)
        .where((builder) => {
          builder.whereNull('expire_time').orWhere('expire_time', '>', now)
        })
        .orderBy('is_top', 'desc')
        .orderBy('publish_time', 'desc')
        .limit(10)

      return Util.end({
        data: result || [],
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'getActiveNotices_1739012356882',
      })
    }
  }

  /**
   * 根据ID获取公告详情
   */
  async fetchDetailById(id) {
    try {
      const result = await Database.select('a.*', 'b.nickname as publisher_name')
        .from('notices as a')
        .leftJoin('member as b', 'a.publish_by', 'b.member_id')
        .where('a.notice_id', id)
        .first()
      return Util.end({
        data: result || null,
      })
    } catch (err) {
      return Util.error({
        msg: err.message,
        stack: err.stack,
        track: 'fetchDetailById_1739012356882',
      })
    }
  }
}

module.exports = NoticesTable
