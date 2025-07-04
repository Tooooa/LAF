const sql = require('mssql');

// 配置数据库连接
const config = {
  user: 'LAF_user',
  password: '1234',
  server: 'localhost',  // 可以是 IP 地址或服务器名称
  database: 'LAF',
  options: {
    encrypt: false,  // 开启加密
  },
};

// 使用 SQL Server 连接池
async function connect() {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}

// 创建新的 UserToken
async function createUserToken(user_id, token_type, token_hash, expires_at) {
  const pool = await database.connect();
  const result = await pool.request()
    .input('user_id', sql.BigInt, user_id)
    .input('token_type', sql.NVarChar, token_type)
    .input('token_hash', sql.NVarChar, token_hash)
    .input('expires_at', sql.DateTime, expires_at)
    .query(`
      INSERT INTO user_tokens (user_id, token_type, token_hash, expires_at, is_revoked, created_at)
      VALUES (@user_id, @token_type, @token_hash, @expires_at, 0, GETDATE());
    `);
  return result.recordset;  // 返回插入的记录
}

// 获取 Token 信息
async function getUserTokenByTokenHash(token_hash) {
  const pool = await database.connect();
  const result = await pool.request()
    .input('token_hash', sql.NVarChar, token_hash)
    .query(`
      SELECT * FROM user_tokens WHERE token_hash = @token_hash;
    `);
  return result.recordset[0];  // 返回第一个匹配的记录
}

// 撤销 Token
async function revokeUserToken(token_hash) {
  const pool = await database.connect();
  const result = await pool.request()
    .input('token_hash', sql.NVarChar, token_hash)
    .query(`
      UPDATE user_tokens SET is_revoked = 1 WHERE token_hash = @token_hash;
    `);
  return result.rowsAffected[0] > 0;  // 返回影响的行数，若大于0表示成功
}

// 获取有效的 Token
async function getValidUserTokens() {
  const pool = await database.connect();
  const result = await pool.request()
    .query(`
      SELECT * FROM user_tokens WHERE expires_at > GETDATE() AND is_revoked = 0;
    `);
  return result.recordset;  // 返回所有有效的 Token
}

// 删除过期或撤销的 Token
async function deleteExpiredOrRevokedTokens() {
  const pool = await database.connect();
  const result = await pool.request()
    .query(`
      DELETE FROM user_tokens WHERE expires_at < GETDATE() OR is_revoked = 1;
    `);
  return result.rowsAffected[0];  // 返回删除的行数
}

// 获取用户的 Token（按用户 ID）
async function getUserTokensByUserId(user_id) {
  const pool = await database.connect();
  const result = await pool.request()
    .input('user_id', sql.BigInt, user_id)
    .query(`
      SELECT * FROM user_tokens WHERE user_id = @user_id;
    `);
  return result.recordset;  // 返回该用户的所有 Token
}

module.exports = {
  createUserToken,
  getUserTokenByTokenHash,
  revokeUserToken,
  getValidUserTokens,
  deleteExpiredOrRevokedTokens,
  getUserTokensByUserId
};
