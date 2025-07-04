const database = require('../config/database');
const sql = require('mssql');

class Message {
  /**
   * 创建一条新消息
   * @param {Object} messageData - 消息数据
   * @param {number} messageData.conversationId
   * @param {number} messageData.fromUserId
   * @param {number} messageData.toUserId
   * @param {string} messageData.content
   * @param {string} [messageData.type='text']
   * @returns {Promise<Object>} 创建的消息对象
   */
  static async create({ conversationId, fromUserId, toUserId, content, type = 'text' }) {
    const pool = await database.connect();
    const query = `
      INSERT INTO messages (conversation_id, from_user_id, to_user_id, content, message_type)
      OUTPUT inserted.*
      VALUES (@conversationId, @fromUserId, @toUserId, @content, @type);
    `;
    
    const result = await pool.request()
      .input('conversationId', sql.BigInt, conversationId)
      .input('fromUserId', sql.BigInt, fromUserId)
      .input('toUserId', sql.BigInt, toUserId)
      .input('content', sql.NVarChar, content)
      .input('type', sql.VarChar, type)
      .query(query);
      
    return result.recordset[0];
  }

  /**
   * 获取一个对话中的所有消息（分页）
   * @param {number} conversationId
   * @param {number} page
   * @param {number} pageSize
   * @returns {Promise<Object>} 包含消息列表和总数
   */
  static async getByConversationId(conversationId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const pool = await database.connect();
    
    const messagesQuery = `
      SELECT 
        m.id,
        m.content,
        m.message_type AS messageType,
        m.is_read AS isRead,
        m.created_at AS createdAt,
        from_u.id AS fromUserId,
        from_u.username AS fromUsername,
        from_u.avatar AS fromAvatar,
        to_u.id AS toUserId,
        to_u.username AS toUsername,
        to_u.avatar AS toAvatar
      FROM messages m
      JOIN users from_u ON m.from_user_id = from_u.id
      JOIN users to_u ON m.to_user_id = to_u.id
      WHERE m.conversation_id = @conversationId
      ORDER BY m.created_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @pageSize ROWS ONLY;
    `;

    const countQuery = `SELECT COUNT(*) as total FROM messages WHERE conversation_id = @conversationId;`;

    const [messagesResult, countResult] = await Promise.all([
      pool.request()
        .input('conversationId', sql.BigInt, conversationId)
        .input('offset', sql.Int, offset)
        .input('pageSize', sql.Int, pageSize)
        .query(messagesQuery),
      pool.request()
        .input('conversationId', sql.BigInt, conversationId)
        .query(countQuery)
    ]);

    return {
      messages: messagesResult.recordset.reverse(), // 返回时按时间正序排列
      total: countResult.recordset[0].total
    };
  }

  // TODO: 添加一个将消息标记为已读的函数
  // static async markAsRead(conversationId, userId) { ... }
}

module.exports = Message;