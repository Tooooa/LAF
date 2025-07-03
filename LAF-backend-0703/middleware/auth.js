exports.authenticateToken = (req, res, next) => {
    // 在真实项目中，这里会包含复杂的token验证逻辑
    console.log('Bypassing authentication for testing.');
    next(); // 直接放行
};