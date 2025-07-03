const jwt = require('jsonwebtoken');
// ------------------- MODIFIED START -------------------
// 移除了 ORM 模型的引用
// const { User } = require('../models/user');
// const { UserToken } = require('../models/userToken');

// 引入基于 mssql 的数据操作模块
const User = require('../models/user'); // 包含 createUser, getUserByUsername, etc.
const UserToken = require('../models/userToken'); // 包含 createUserToken, getUserTokenByTokenHash, etc.
// ------------------- MODIFIED END -------------------

const JWT_SECRET = process.env.JWT_SECRET || 'ez4us';
const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1小时
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7天

// 生成Token (此函数无需修改)
const generateToken = (userId, type = 'access') => {
  const expiresIn = type === 'access' ? ACCESS_TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY;
  return jwt.sign({ userId, type }, JWT_SECRET, { expiresIn });
};

// 注册
exports.register = async (req, res) => {
  try {
    const { username, phone, password, confirmPassword, email } = req.body;

    // 验证密码 (逻辑不变)
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '两次输入的密码不一致'
      });
    }

    // ------------------- MODIFIED START -------------------
    // 原代码:
    // const user = await User.create({ ... });

    // 新代码: 使用 user.js 中的 createUser
    await User.createUser(username, phone, email, password);

    // createUser 不返回创建的用户对象，所以需要重新查询以获取完整信息
    const user = await User.getUserByUsername(username);

    // ------------------- MODIFIED END -------------------

    res.status(201).json({
      success: true,
      code: 201,
      message: '注册成功',
      data: {
        userId: user.id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    // ------------------- MODIFIED START -------------------
    // 原代码:
    // if (error.name === 'SequelizeUniqueConstraintError') { ... }

    // 新代码: 捕获 mssql 的唯一约束冲突错误 (错误码 2627 或 2601)
    if (error.number === 2627 || error.number === 2601) {
      res.status(400).json({
        success: false,
        code: 400,
        message: '用户名、手机号或邮箱已被使用'
      });
    } else {
      console.error("Register Error:", error); // 打印未知错误以供调试
      res.status(500).json({
        success: false,
        code: 500,
        message: '服务器内部错误'
      });
    }
    // ------------------- MODIFIED END -------------------
  }
};

// 登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ------------------- MODIFIED START -------------------
    // 原代码:
    // const user = await User.findOne({ where: { username } });
    
    // 新代码: 使用 user.js 中的 getUserByUsername
    const user = await User.getUserByUsername(username);
    // ------------------- MODIFIED END -------------------
    if (!user) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // ------------------- MODIFIED START -------------------
    // 原代码:
    // const isValid = await user.validatePassword(password);
    
    // 新代码: 使用 user.js 中的 validatePassword
    const isValid = await User.validatePassword(user, password);
    console.log('[DEBUG]: ', isValid);
    // ------------------- MODIFIED END -------------------
    if (!isValid) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 生成token (逻辑不变)
    const accessToken = generateToken(user.id, 'access');
    const refreshToken = generateToken(user.id, 'refresh');

    // ------------------- MODIFIED START -------------------
    // 原代码:
    // await UserToken.create({ ... });
    
    // 新代码: 使用 userToken.js 中的 createUserToken
    await UserToken.createUserToken(
      user.id,
      'refresh',
      refreshToken,
      new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000)
    );

    // 原代码:
    // await user.update({ last_login_at: new Date() });
    
    // 新代码: 使用 user.js 中的 updateLastLoginAt
    await User.updateLastLoginAt(user.id);
    // ------------------- MODIFIED END -------------------

    res.json({
      success: true,
      code: 200,
      message: '登录成功',
      data: {
        code: 200,
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          email: user.email
        }
      }
    });
  } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({
          success: false,
          code: 500,
          message: '服务器内部错误'
      });
  }
};

// 刷新Token
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.headers.authorization?.split(' ')[1];
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: '未提供刷新令牌'
      });
    }

    // 验证token (逻辑不变)
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        code: 401,
        message: '无效的刷新令牌'
      });
    }

    // ------------------- MODIFIED START -------------------
    // 原代码:
    // const tokenRecord = await UserToken.findOne({ where: { ... } });
    
    // 新代码: 使用 userToken.js 中的函数，并手动进行验证
    // 1. 根据 token hash 查找记录
    const tokenRecord = await UserToken.getUserTokenByTokenHash(refreshToken);

    // 2. 检查记录是否存在，并验证其他条件
    if (!tokenRecord || 
        tokenRecord.user_id.toString() !== decoded.userId.toString() || // 确保 user_id 匹配 (注意 BigInt 和 number 的比较)
        tokenRecord.token_type !== 'refresh' ||
        tokenRecord.is_revoked) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: '刷新令牌已失效'
      });
    }
    // ------------------- MODIFIED END -------------------

    // 生成新的访问令牌 (逻辑不变)
    const accessToken = generateToken(decoded.userId, 'access');

    res.json({
      success: true,
      code: 200,
      message: 'Token刷新成功',
      data: {
        accessToken,
        expiresIn: ACCESS_TOKEN_EXPIRY
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        code: 401,
        message: '无效或已过期的刷新令牌'
      });
    } else {
      console.error("Refresh Error:", error);
      res.status(500).json({
          success: false,
          code: 500,
          message: '服务器内部错误'
      });
    }
  }
};

// 登出
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: '未提供访问令牌'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // ------------------- MODIFIED START -------------------
    // 原代码:
    // await UserToken.update({ is_revoked: true }, { where: { user_id: decoded.userId, is_revoked: false } });
    
    // 新代码: 由于 userToken.js 没有提供批量更新功能，我们需要分步实现
    // 1. 获取该用户所有未被撤销的 token
    const userTokens = await UserToken.getUserTokensByUserId(decoded.userId);
    const activeTokens = userTokens.filter(t => !t.is_revoked);
    
    // 2. 遍历并逐个撤销
    // 使用 Promise.all 来并行执行所有撤销操作，提高效率
    const revocationPromises = activeTokens.map(t => 
      UserToken.revokeUserToken(t.token_hash)
    );
    await Promise.all(revocationPromises);
    // ------------------- MODIFIED END -------------------

    res.json({
      success: true,
      code: 200,
      message: '登出成功'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        code: 401,
        message: '无效或已过期的访问令牌'
      });
    } else {
      console.error("Logout Error:", error);
      res.status(500).json({
          success: false,
          code: 500,
          message: '服务器内部错误'
      });
    }
  }
};