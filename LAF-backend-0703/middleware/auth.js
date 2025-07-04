// middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/user'); // 确保这里的路径是正确的
const { asyncHandler } = require('./asyncHandler'); // 确保 asyncHandler 中间件存在且路径正确

exports.authenticateToken = asyncHandler(async (req, res, next) => {
    
    // --- 测试模式：跳过所有验证 ---

    console.log('--- 警告：认证中间件处于测试模式，所有请求都将以固定用户身份通过 ---');

    // 1. 直接指定一个用于测试的固定用户 ID
    const MOCK_USER_ID = 1; // 你可以改成任何你数据库中存在的用户 ID

    try {
        // 2. 从数据库获取这个固定的用户信息
        const mockUser = await User.getUserById(MOCK_USER_ID);

        // 3. 检查这个模拟用户是否存在，以防数据库中没有这个 ID
        if (!mockUser) {
            console.error(`测试错误：数据库中找不到 ID 为 ${MOCK_USER_ID} 的用户`);
            return res.status(500).json({ success: false, message: '测试配置错误：模拟用户不存在' });
        }

        // 4. 将这个模拟用户附加到 req 对象上
        req.user = mockUser;

        // 5. 放行，让请求进入下一个处理程序
        next();

    } catch (err) {
        console.error("在获取模拟用户时出错:", err);
        return res.status(500).json({ success: false, message: '服务器内部错误（测试模式）' });
    }
});