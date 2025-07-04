// controllers/messageController.js

const Conversation = require('../models/conversation'); // 新的SQL模型
const Message = require('../models/message');       // 新的SQL模型
const { asyncHandler } = require('../middleware/asyncHandler');

/**
 * @desc    发送私信
 * @route   POST /v1/messages
 */
exports.sendMessage = asyncHandler(async (req, res, next) => {
    const { toUserId, itemId, content, type = 'text' } = req.body;
    const fromUserId = req.user.id; 

    if (!toUserId || !itemId || !content) {
        return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    if (fromUserId.toString() === toUserId.toString()) {
        return res.status(400).json({ success: false, message: '不能给自己发送消息' });
    }

    // 1. 查找或创建对话 (现在使用我们的新方法)
    const conversation = await Conversation.findOrCreate(itemId, fromUserId, toUserId);

    // 2. 创建新消息
    const newMessage = await Message.create({
        conversationId: conversation.id,
        fromUserId: fromUserId,
        toUserId: toUserId,
        content: content,
        messageType: type
    });

    // 3. 更新对话的最后一条消息信息
    await Conversation.updateLastMessage(conversation.id, newMessage.id);
    
    res.status(201).json({ success: true, message: '消息发送成功', data: newMessage });
});

/**
 * @desc    获取对话列表
 * @route   GET /v1/messages/conversations
 */
exports.getConversations = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const conversations = await Conversation.getByUserId(userId);
    res.status(200).json({ success: true, data: { conversations } });
});

/**
 * @desc    获取对话中的消息
 * @route   GET /v1/messages/conversations/:conversationId
 */
exports.getMessagesInConversation = asyncHandler(async (req, res, next) => {
    const { conversationId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;

    // TODO: 这里可以加一个权限校验，确保当前用户是这个对话的参与者

    const { messages, total } = await Message.getByConversationId(conversationId, parseInt(page), parseInt(pageSize));
    
    res.status(200).json({
        success: true,
        data: {
            messages,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        }
    });
});