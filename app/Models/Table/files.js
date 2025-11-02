const Database = use('Database')
const Util = require('@Lib/Util')
const BaseTable = require('@BaseClass/BaseTable')

class FilesTable extends BaseTable {
  constructor() {
    const data = {
      table_name: 'files',
      primary_key: 'file_id',
      fields: {
        file_id: {
          type: 'int',
          primary: true,
          auto_increment: true,
        },
        file_name: {
          type: 'string',
          length: 255,
          nullable: false,
          comment: '原始文件名',
        },
        file_path: {
          type: 'string',
          length: 500,
          nullable: false,
          comment: '文件存储路径',
        },
        file_size: {
          type: 'int',
          nullable: true,
          comment: '文件大小（字节）',
        },
        file_type: {
          type: 'string',
          length: 50,
          nullable: true,
          comment: '文件类型（MIME类型）',
        },
        file_ext: {
          type: 'string',
          length: 20,
          nullable: true,
          comment: '文件扩展名',
        },
        category: {
          type: 'string',
          length: 50,
          nullable: false,
          default: 'other',
          comment: '文件分类',
        },
        upload_by: {
          type: 'int',
          nullable: true,
          comment: '上传者ID',
        },
        description: {
          type: 'string',
          nullable: true,
          comment: '文件描述',
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
   * 获取文件列表
   * @example
   * fetchListBy({ category, search, page, limit })
   */
  async fetchListBy(obj) {
    try {
      let result = {}
      const table = Database.clone()
      table
        .select('a.*', 'b.nickname as uploader_name')
        .from('files as a')
        .leftJoin('member as b', 'a.upload_by', 'b.member_id')
        .orderBy('a.created_at', 'desc')

      if (obj.category) {
        table.where('a.category', obj.category)
      }

      if (obj.search) {
        table.where((builder) => {
          builder.where('a.file_name', 'like', `%${obj.search}%`)
          builder.orWhere('a.description', 'like', `%${obj.search}%`)
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
   * 根据ID获取文件详情
   */
  async fetchDetailById(id) {
    try {
      const result = await Database.select('*')
        .from(this.tableName)
        .where(this.primaryKey, id)
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

module.exports = FilesTable

