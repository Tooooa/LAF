const express = require('express');
const Joi = require('joi');
const { validateRequest } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getUserById, updateUserProfile, updateUserPassword } = require('../models/user');

const router = express.Router();

// 验证规则
const getProfileSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

const updateProfileSchema = Joi.object({
  username: Joi.string().min(3).max(50),
  avatar: Joi.string().uri().allow(null, '')
});

const updatePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(6).required()
});

// GET /profile - 获取用户基本信息
router.get('/',
  validateRequest(getProfileSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { id } = req.query;
    const user = await getUserById(id);

    console.log('[DEBUG]: ', user);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '用户不存在',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      code: 200,
      message: '获取成功',
      data: user,
      timestamp: new Date().toISOString()
    });
  })
);

// PATCH /profile - 更新用户基本信息
router.patch('/',
  validateRequest(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.query;
    const updates = req.body;
    
    const success = await updateUserProfile(id, updates);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '更新失败',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      code: 200,
      message: '更新成功',
      timestamp: new Date().toISOString()
    });
  })
);

// POST /profile/password - 更新用户密码
router.post('/password',
  validateRequest(updatePasswordSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.query;
    const { oldPassword, newPassword } = req.body;
    
    // 1. 验证旧密码
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '用户不存在',
        timestamp: new Date().toISOString()
      });
    }
    
    const isValid = await validatePassword(user, oldPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: '旧密码不正确',
        timestamp: new Date().toISOString()
      });
    }
    
    // 2. 更新密码
    const success = await updateUserPassword(id, newPassword);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '密码更新失败',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      code: 200,
      message: '密码更新成功',
      timestamp: new Date().toISOString()
    });
  })
);

module.exports = router;