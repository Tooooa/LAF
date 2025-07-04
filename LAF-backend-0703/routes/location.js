const express = require('express');
const Joi = require('joi');
const Location = require('../models/Location');
const { validateRequest } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// 验证规则
const suggestionsSchema = Joi.object({
  query: Joi.string().max(100).allow('').optional(),
  type: Joi.string().valid('building', 'area', 'room', 'other', 'all').default('all'),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const childrenSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50)
});

// GET /locations/suggestions - 获取地点建议
router.get('/suggestions', 
  validateRequest(suggestionsSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { query, type, limit } = req.query;
    // ======================= 最终修复 =========================
    // 无论 limit 是字符串 '10' 还是 undefined，这行代码都能确保得到一个整数。
    // parseInt('10') -> 10
    // parseInt(undefined) -> NaN,  NaN || 20 -> 20
    const finalLimit = parseInt(limit, 10) || 20;
    // ==========================================================
    const suggestions = await Location.getSuggestions(query, type, finalLimit); 
    res.json({
      success: true,
      code: 200,
      message: '获取成功',
      data: {
        suggestions: suggestions
      },
      timestamp: new Date().toISOString()
    });
  })
);

// GET /locations/popular - 获取热门地点
router.get('/popular',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    
    const popularLocations = await Location.getPopularLocations(limit);
    
    res.json({
      success: true,
      code: 200,
      message: '获取成功',
      data: {
        locations: popularLocations
      },
      timestamp: new Date().toISOString()
    });
  })
);

// GET /locations/:id - 获取地点详情
router.get('/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // 验证ID格式
    if (!id || id.length > 50) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '地点ID格式不正确',
        timestamp: new Date().toISOString()
      });
    }
    
    const location = await Location.getById(id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '地点不存在',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      code: 200,
      message: '获取成功',
      data: location,
      timestamp: new Date().toISOString()
    });
  })
);

// GET /locations/:id/children - 获取子地点
router.get('/:id/children',
  validateRequest(childrenSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { limit } = req.query;
    const finalLimit = parseInt(limit, 10) || 50;
    // 验证父级地点是否存在
    const parentLocation = await Location.getById(id);
    if (!parentLocation) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '父级地点不存在',
        timestamp: new Date().toISOString()
      });
    }
    
    const children = await Location.getChildren(id, finalLimit);
    
    res.json({
      success: true,
      code: 200,
      message: '获取成功',
      data: {
        parent: {
          id: parentLocation.id,
          name: parentLocation.name,
          fullName: parentLocation.fullName,
          type: parentLocation.type
        },
        children: children
      },
      timestamp: new Date().toISOString()
    });
  })
);

module.exports = router;
