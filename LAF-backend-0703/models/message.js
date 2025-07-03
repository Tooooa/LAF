// backend/models/message.js
const sql = require('mssql');
// 假设您有一个 conversation.js 模型来更新对话的最后消息
const Conversation = require('./conversation');

// --- 数据库配置和连接函数 (与 user.js 保持一致) ---
const config = {
  user: 'LAF_user',
  password: '1234',
  server: 'localhost',
  database: 'LAF',
  options: {
    encrypt: false,
  },
};

async function connect() {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}

/**
 * 在一个指定的对话中创建一条新消息
 * @param {object} messageData - 包含消息所有信息的对象
 * @param {number} messageData.conversationId - 所属对话的ID
 * @param {number} messageData.fromUserId - 发送者用户ID
 * @param {number} messageData.toUserId - 接收者用户ID
 * @param {string} messageData.content - 消息内容 (文本或描述)
 * @param {string} [messageData.messageType='text'] - 消息类型
 * @param {string} [messageData.attachmentUrl=null] - 附件URL
 * @param {number} [messageData.replyToId=null] - 回复的消息ID
 * @returns {Promise<Object>} 创建的消息对象
 */
async function createMessage(messageData) {
  const {
    conversationId,
    fromUserId,
    toUserId,
    content,
    messageType = 'text',
    attachmentUrl = null,
    replyToId = null,
  } = messageData;

  const pool = await connect();
  // 1. 插入新消息
  const result = await pool.request()
    .input('conversation_id', sql.BigInt, conversationId)
    .input('from_user_id', sql.BigInt, fromUserId)
    .input('to_user_id', sql.BigInt, toUserId)
    .input('content', sql.NVarChar, content) // 使用 NVarChar 以支持 Unicode
    .input('message_type', sql.NVarChar(10), messageType)
    .input('attachment_url', sql.NVarChar(500), attachmentUrl)
    .input('reply_to_id', sql.BigInt, replyToId)
    .query(`
      INSERT INTO messages (
        conversation_id, from_user_id, to_user_id, content, 
        message_type, attachment_url, reply_to_id, created_at
      )
      OUTPUT INSERTED.*
      VALUES (
        @conversation_id, @from_user_id, @to_user_id, @content,
        @message_type, @attachment_url, @reply_to_id, GETDATE()
      );
    `);

  const newMessage = result.recordset[0];

  if (newMessage && Conversation && Conversation.updateLastMessage) {
    // 2. 异步更新父对话的 last_message 信息，无需等待
    Conversation.updateLastMessage(conversationId, newMessage.id)
        .catch(err => console.error('Failed to update last message:', err));
  }

  return newMessage;
}

/**
 * 获取一个对话中的所有消息
 * @param {number} conversationId - 对话ID
 * @returns {Promise<Array<Object>>} 消息对象数组
 */
async function getMessagesByConversationId(conversationId) {
  const pool = await connect();
  const result = await pool.request()
    .input('conversation_id', sql.BigInt, conversationId)
    .query(`
      SELECT m.*, u.username AS from_username, u.avatar AS from_avatar
      FROM messages m
      JOIN users u ON m.from_user_id = u.id
      WHERE m.conversation_id = @conversation_id
      ORDER BY m.created_at ASC;
    `);
  return result.recordset;
}

/**
 * 批量更新消息状态 (例如，从未读更新为已读)
 * @param {Array<number>} messageIds - 需要更新的消息ID数组
 * @param {'delivered'|'read'|'deleted'} newStatus - 新的状态
 * @param {number} recipientId - 接收者ID (确保只有接收者能将消息标记为已读)
 * @returns {Promise<boolean>} 是否更新成功
 */
async function updateMessageStatus(messageIds, newStatus, recipientId) {
  if (!messageIds || messageIds.length === 0) {
    return false;
  }

  const pool = await connect();
  const request = pool.request();
  
  // 动态构建 IN 子句的参数，这是处理数组参数的安全方式
  const idParams = messageIds.map((id, index) => `@id${index}`);
  messageIds.forEach((id, index) => {
    request.input(`id${index}`, sql.BigInt, id);
  });
  
  request.input('new_status', sql.NVarChar(10), newStatus);
  request.input('recipient_id', sql.BigInt, recipientId);

  let query = `
    UPDATE messages 
    SET status = @new_status
  `;
  // 如果状态是'read'，同时更新 read_at 时间戳
  if (newStatus === 'read') {
    query += `, read_at = GETDATE()`;
  }
  query += `
    WHERE id IN (${idParams.join(',')}) 
      AND to_user_id = @recipient_id 
      AND status != 'read'; -- 避免重复标记已读
  `;
  
  const result = await request.query(query);
  return result.rowsAffected[0] > 0;
}

/**
 * 获取一个用户的所有未读消息总数
 * @param {number} userId - 用户ID
 * @returns {Promise<number>} 未读消息数量
 */
async function getUnreadMessageCount(userId) {
    const pool = await connect();
    const result = await pool.request()
      .input('user_id', sql.BigInt, userId)
      .query(`
        SELECT COUNT(*) AS unreadCount
        FROM messages
        WHERE to_user_id = @user_id AND status != 'read';
      `);
    return result.recordset[0]?.unreadCount || 0;
}

module.exports = {
  createMessage,
  getMessagesByConversationId,
  updateMessageStatus,
  getUnreadMessageCount,
};