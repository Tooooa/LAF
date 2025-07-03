const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 注册
router.post('/register', authController.register);

// 登录
router.post('/login', authController.login);

// 刷新Token
router.post('/refresh', authController.refresh);

// 登出
router.post('/logout', authController.logout);

module.exports = router; 