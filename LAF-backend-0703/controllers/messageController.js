// controllers/messageController.js

const Conversation = require('../models/conversation'); // 新的SQL模型
const Message = require('../models/message');       // 新的SQL模型
const { asyncHandler } = require('../middleware/asyncHandler');

/**
 * @desc    发送私信
 * @route   POST /v1/messages
 */
exports.sendMessage = asyncHandler(async (req, res, next) => {
    // 1. 接收参数并立即进行类型转换
    const toUserId = Number(req.body.toUserId);
    const itemId = Number(req.body.itemId);
    const { content, type = 'text' } = req.body;
    const fromUserId = req.user.id; 

    // 2. 增加对转换后结果的校验 (非常重要！)
    if (!toUserId || !itemId || !content) {
        return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    // 检查转换后的 ID 是否是有效的数字
    if (isNaN(toUserId) || isNaN(itemId)) {
        return res.status(400).json({ success: false, message: 'ID 格式无效，必须是数字' });
    }

    // 这里不再需要 .toString()，因为 fromUserId 和 toUserId 现在都是数字类型了
    if (fromUserId === toUserId) {
        return res.status(400).json({ success: false, message: '不能给自己发送消息' });
    }

    // 3. 查找或创建对话 (现在传递的是正确的数字类型)
    const conversation = await Conversation.findOrCreate(itemId, fromUserId, toUserId);
    
    // 检查 findOrCreate 是否成功返回了对话
    if (!conversation || !conversation.id) {
        // 这是一个服务器端问题，可能是数据库逻辑有误
        console.error('findOrCreate未能返回有效的对话对象', {itemId, fromUserId, toUserId});
        return res.status(500).json({ success: false, message: '无法创建或查找对话' });
    }

    console.log('[DEBUG]: 成功获取或创建对话', conversation);

    // 4. 创建新消息
    const newMessage = await Message.create({
        conversationId: conversation.id,
        fromUserId: fromUserId,
        toUserId: toUserId, // 确保 Message.create 也使用数字
        content: content,
        messageType: type
    });

    // 5. 更新对话的最后一条消息信息
    await Conversation.updateLastMessage(conversation.id, newMessage.id);

    console.log('[DEBUG]: 成功获取或创建对话', newMessage);
    
    res.status(201).json({ success: true, message: '消息发送成功', data: newMessage });
});

/**
 * @desc    获取对话列表
 * @route   GET /v1/messages/conversations
 */
exports.getConversations = asyncHandler(async (req, res, next) => {
    // console.log('[convers]: ', req.user);
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