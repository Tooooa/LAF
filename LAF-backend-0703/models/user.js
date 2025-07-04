const database = require('../config/database');
const sql = require('mssql');
const bcrypt = require('bcryptjs');

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

// 创建新的用户
async function createUser(username, phone, email, password, avatar = null, status = 'active') {
  const hashedPassword = await bcrypt.hash(password, 10);
  const pool = await database.connect();
  const result = await pool.request()
    .input('username', sql.NVarChar, username)
    .input('phone', sql.NVarChar, phone)
    .input('email', sql.NVarChar, email)
    .input('password', sql.NVarChar, hashedPassword)
    .input('avatar', sql.NVarChar, avatar)
    .input('status', sql.NVarChar, status)
    .query(`
      INSERT INTO users (username, phone, email, password, avatar, status, created_at, updated_at)
      VALUES (@username, @phone, @email, @password, @avatar, @status, GETDATE(), GETDATE());
    `);
  return result.recordset;  // 返回插入的记录
}

// 获取用户信息
async function getUserByUsername(username) {
  const pool = await database.connect();
  const result = await pool.request()
    .input('username', sql.NVarChar, username)
    .query(`
      SELECT * FROM users WHERE username = @username;
    `);
  return result.recordset[0];  // 返回第一个匹配的用户
}

// 验证密码方法
async function validatePassword(user, password) {
  // console.log('[DEBUG]: ', password, ', ', user.password);
  // console.log('[DEBUG]: ', bcrypt.compare(password, user.password));
  return bcrypt.compare(password, user.password);
}

// 更新用户登录时间
async function updateLastLoginAt(userId) {
  const pool = await database.connect();
  const result = await pool.request()
    .input('user_id', sql.BigInt, userId)
    .query(`
      UPDATE users SET last_login_at = GETDATE() WHERE id = @user_id;
    `);
  return result.rowsAffected[0] > 0;  // 返回影响的行数
}

// 获取用户状态
async function getUserStatus(userId) {
  const pool = await database.connect();
  const result = await pool.request()
    .input('user_id', sql.BigInt, userId)
    .query(`
      SELECT status FROM users WHERE id = @user_id;
    `);
  return result.recordset[0];  // 返回用户的状态
}

// 更新用户状态
async function updateUserStatus(userId, status) {
  const pool = await database.connect();
  const result = await pool.request()
    .input('user_id', sql.BigInt, userId)
    .input('status', sql.NVarChar, status)
    .query(`
      UPDATE users SET status = @status WHERE id = @user_id;
    `);
  return result.rowsAffected[0] > 0;  // 返回影响的行数
}

// 获取用户的所有 Token（如果需要）
async function getUserTokens(userId) {
  const pool = await database.connect();
  const result = await pool.request()
    .input('user_id', sql.BigInt, userId)
    .query(`
      SELECT * FROM user_tokens WHERE user_id = @user_id;
    `);
  return result.recordset;  // 返回该用户的所有 Token
}

/**
 * 根据ID获取用户基本信息（不包含敏感信息）
 * @param {number} id - 用户ID
 * @returns {Promise<Object|null>} 用户对象或null
 */
async function getUserById(id) {
  const pool = await database.connect();
  try {
    const result = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT 
          id,
          username,
          avatar,
          status,
          last_login_at AS lastLoginAt,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM users 
        WHERE id = @id;
      `);
    return result.recordset[0] || null;
  } catch (err) {
    console.error('获取用户信息失败:', err);
    throw err;
  }
}

/**
 * 更新用户基本信息
 * @param {number} id - 用户ID
 * @param {Object} updates - 更新字段对象
 * @returns {Promise<boolean>} 是否更新成功
 */
async function updateUserProfile(id, updates) {
  const pool = await database.connect();
  try {
    const result = await pool.request()
      .input('id', sql.BigInt, id)
      .input('username', sql.NVarChar, updates.username)
      .input('avatar', sql.NVarChar, updates.avatar)
      .query(`
        UPDATE users 
        SET 
          username = @username,
          avatar = @avatar,
          updated_at = GETDATE()
        WHERE id = @id;
      `);
    return result.rowsAffected[0] > 0;
  } catch (err) {
    console.error('更新用户信息失败:', err);
    throw err;
  }
}

/**
 * 更新用户密码
 * @param {number} id - 用户ID
 * @param {string} newPassword - 新密码
 * @returns {Promise<boolean>} 是否更新成功
 */
async function updateUserPassword(id, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const pool = await database.connect();
  try {
    const result = await pool.request()
      .input('id', sql.BigInt, id)
      .input('password', sql.NVarChar, hashedPassword)
      .query(`
        UPDATE users 
        SET 
          password = @password,
          updated_at = GETDATE()
        WHERE id = @id;
      `);
    return result.rowsAffected[0] > 0;
  } catch (err) {
    console.error('更新密码失败:', err);
    throw err;
  }
}

module.exports = {
  createUser,
  getUserByUsername,
  validatePassword,
  updateLastLoginAt,
  getUserStatus,
  updateUserStatus,
  getUserTokens,
  getUserById,
  updateUserProfile,
  updateUserPassword
};
