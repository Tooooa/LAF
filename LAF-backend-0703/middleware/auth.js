exports.authenticateToken = (req, res, next) => {
    // token验证逻辑
    console.log('Bypassing authentication for testing.');
    console.log('Token: ', req);
    next(); 
};