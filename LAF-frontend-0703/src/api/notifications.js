// src/api/notifications.js
import request from '@/utils/request'; // 假设你有一个封装好的axios实例

/**
 * 获取通知列表
 * @param {object} params - { userId }
 */
export function getNotifications(params) {
  return request({
    url: '/notifications',
    method: 'get',
    params,
  });
}

/**
 * 将通知标记为已读
 * @param {object} data - { notificationId, userId }
 */
export function markNotificationAsRead(data) {
  const { notificationId, userId } = data;
  return request({
    url: `/notifications/${notificationId}/read`,
    method: 'put',
    data: { userId }, // 将userId放在请求体中，用于后端验证
  });
}

/**
 * 删除通知
 * @param {object} data - { notificationId, userId }
 */
export function deleteNotification(data) {
  const { notificationId, userId } = data;
  return request({
    url: `/notifications/${notificationId}`,
    method: 'delete',
    data: { userId }, // 将userId放在请求体中，用于后端验证
  });
}