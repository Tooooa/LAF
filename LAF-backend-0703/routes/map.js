const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const { authenticateToken } = require('../middleware/auth');

// 获取地图范围内的物品
router.get('/items', authenticateToken, mapController.getMapItems);

// 获取地图统计信息
router.get('/statistics', authenticateToken, mapController.getMapStatistics);

module.exports = router;