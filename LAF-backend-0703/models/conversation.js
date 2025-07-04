const database = require('../config/database');
const sql = require('mssql');

class Conversation {
  /**
   * 查找或创建一个新的对话
   * @param {number} itemId - 物品ID
   * @param {number} user1Id - 参与者1的ID
   * @param {number} user2Id - 参与者2的ID
   * @returns {Promise<Object>} 对话对象
   */
  static async findOrCreate(itemId, user1Id, user2Id) {
    // 保证 user1_id 总是较小的那个
    const participant1 = Math.min(user1Id, user2Id);
    const participant2 = Math.max(user1Id, user2Id);

    const pool = await database.connect();
    // 尝试使用 MERGE 语句（SQL Server 2008+），它能在一个原子操作中完成“查找或创建”
    const query = `
      MERGE INTO conversations WITH (HOLDLOCK) AS target
      USING (SELECT @itemId AS item_id, @p1 AS p1, @p2 AS p2) AS source
      ON (target.item_id = source.item_id AND target.user1_id = source.p1 AND target.user2_id = source.p2)
      WHEN NOT MATCHED THEN
        INSERT (item_id, user1_id, user2_id)
        VALUES (source.item_id, source.p1, source.p2)
      OUTPUT inserted.*;
    `;
    
    const result = await pool.request()
      .input('itemId', sql.BigInt, itemId)
      .input('p1', sql.BigInt, participant1)
      .input('p2', sql.BigInt, participant2)
      .query(query);

    return result.recordset[0];
  }

  /**
   * 更新对话的最后一条消息信息
   * @param {number} conversationId - 对话ID
   * @param {number} messageId - 消息ID
   */
  static async updateLastMessage(conversationId, messageId) {
    const pool = await database.connect();
    const query = `
      UPDATE conversations
      SET last_message_id = @messageId, last_message_at = GETDATE(), updated_at = GETDATE()
      WHERE id = @conversationId;
    `;
    await pool.request()
      .input('conversationId', sql.BigInt, conversationId)
      .input('messageId', sql.BigInt, messageId)
      .query(query);
  }

  /**
   * 获取一个用户的所有对话列表
   * @param {number} userId - 当前用户ID
   * @returns {Promise<Array>} 对话列表
   */
  static async getByUserId(userId) {
    const pool = await database.connect();
    const query = `
      SELECT 
        c.id,
        c.item_id AS itemId,
        i.title AS itemTitle,
        i.type AS itemType,
        
        -- 找出对话中的另一个参与者
        other_user.id AS participantId,
        other_user.username AS participantUsername,
        other_user.avatar AS participantAvatar,

        -- 最后一条消息信息
        m.id AS lastMessageId,
        m.content AS lastMessageContent,
        m.created_at AS lastMessageCreatedAt,
        m_from_user.username AS lastMessageFromUsername,

        0 AS unreadCount

      FROM conversations c
      
      -- 使用 LEFT JOIN，即使物品被删除，对话依然能显示
      LEFT JOIN items i ON c.item_id = i.id
      
      -- 使用 LEFT JOIN，即使没有最后一条消息（新对话），也能正常显示
      LEFT JOIN messages m ON c.last_message_id = m.id
      
      -- 使用 LEFT JOIN，即使发送最后一条消息的用户被删除，也能正常显示
      LEFT JOIN users m_from_user ON m.from_user_id = m_from_user.id
      
      -- 【关键修改】使用 LEFT JOIN，即使对话的另一方用户被删除，这个对话也应该被查出来
      -- 否则 INNER JOIN 会因为找不到被删除的用户而直接过滤掉整个对话记录
      LEFT JOIN users other_user ON other_user.id = CASE 
        WHEN c.user1_id = @userId THEN c.user2_id 
        ELSE c.user1_id 
      END
      
      WHERE c.user1_id = @userId OR c.user2_id = @userId
      ORDER BY c.last_message_at DESC;
    `;
    
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(query);

    return result.recordset;
  }
}

module.exports = Conversation;