// routes/messages.js
const express = require('express');
const router = express.Router();
const {
    sendMessage,
    getConversations,
    getMessagesInConversation
} = require('../controllers/messageController'); // 我们稍后会创建这个文件
const { authenticateToken } = require('../middleware/auth');

// @route   POST /api/v1/messages
// @desc    发送私信
// @access  Private
router.post('/', authenticateToken, sendMessage);

// @route   GET /api/v1/messages/conversations
// @desc    获取当前用户的对话列表
// @access  Private
router.get('/conversations', authenticateToken, getConversations);
    
// @route   GET /api/v1/messages/conversations/:conversationId
// @desc    获取特定对话中的所有消息
// @access  Private
router.get('/conversations/:conversationId', authenticateToken, getMessagesInConversation);

module.exports = router;