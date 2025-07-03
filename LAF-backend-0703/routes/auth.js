const express = require('express');
const router = express.Router();

/**
 * @route POST /auth/login
 * @description 用户登录接口
 * @access Public
 */
router.post('/login', (req, res) => {
  // todo: 这里应该实现登录逻辑
  // 暂时返回true表示成功
  console.log('[DEBUG]: get login information.');
  res.json({
    success: true,
    message: 'Login endpoint reached',
    data: {
      code: 200,
      token: 'dummy-token-for-now',
      user: {
        id: 'user-id-placeholder',
        username: req.body.username || 'testuser'
      }
    }
  });
});

/**
 * @route POST /auth/register
 * @description 用户注册接口
 * @access Public
 */
router.post('/register', (req, res) => {
  // todo: 这里应该实现注册逻辑
  // 暂时返回true表示成功
  console.log('[DEBUG]: get register information.');
  res.json({
    success: true,
    message: 'Registration endpoint reached',
    data: {
      id: 'new-user-id-placeholder',
      username: req.body.username || 'newuser',
      email: req.body.email || 'newuser@example.com'
    }
  });
});

module.exports = router;