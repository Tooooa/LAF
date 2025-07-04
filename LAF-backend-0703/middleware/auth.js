// middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/user'); // 确保这里的路径是正确的
const { asyncHandler } = require('./asyncHandler'); // 确保 asyncHandler 中间件存在且路径正确

exports.authenticateToken = asyncHandler(async (req, res, next) => {
    let token;

    // 1. 从请求头中提取 Token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    // 2. 检查 Token 是否存在
    if (!token) {
        // 如果没有 token，立即返回 401 未授权错误
        return res.status(401).json({ success: false, message: '未授权，没有提供Token' });
    }

    try {
        // 3. 验证 Token 的有效性
        // 确保你的 .env 文件中有 JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. 使用 Token 中的 ID 从数据库查找用户
        const user = await User.getUserById(decoded.userId)

        // 5. 检查用户是否存在
        if (!user) {
            // 如果数据库中找不到该用户，返回 401 错误
            return res.status(401).json({ success: false, message: '未授权，用户不存在' });
        }

        // 6. 【关键步骤】将完整的用户信息附加到 req 对象上
        req.user = user;

        // 7. 一切正常，将请求传递给下一个处理程序（你的控制器）
        next();

    } catch (err) {
        // 如果 jwt.verify 失败 (比如 token 过期或被篡改)，会进入这里
        console.error("Token 验证失败:", err.message);
        return res.status(401).json({ success: false, message: '未授权，Token无效或已过期' });
    }
});