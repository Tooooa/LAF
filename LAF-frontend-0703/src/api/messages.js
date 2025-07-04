import request from '../utils/request';

// 8.1 发送私信
export function sendMessage(data) {
  return request({
    url: '/messages',
    method: 'post',
    data
  });
}

// 8.2 获取对话列表
export function getConversations() {
  return request({
    url: '/messages/conversations',
    method: 'get'
  });
}

// 8.3 获取特定对话的消息
// API 设计中是 /messages/conversations/{conversationId}
export function getMessagesInConversation(conversationId, params) {
  return request({
    url: `/messages/conversations/${conversationId}`,
    method: 'get',
    params // 用于分页等查询参数
  });
}

// 7.1 获取通知列表 (包括新消息通知)
// 你的API设计中有单独的通知模块，这里也可以集成
export function getNotifications(params) {
  return request({
    url: '/notifications',
    method: 'get',
    params
  });
}