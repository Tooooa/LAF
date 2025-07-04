// src/utils/date.js

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {Date|string} date - 可以是 Date 对象或 ISO 字符串
 * @returns {string} 格式化后的日期，如 "2023-05-16"
 */
export function formatDateSimple(date) {
  if (!date) return '未知日期';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '无效日期';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期为相对时间 (例如: "5分钟前", "昨天")
 * 用于 ConversationListItem.vue
 * @param {string | Date} dateInput - 可以是ISO 8601格式的字符串或Date对象
 * @returns {string} 格式化后的相对时间字符串
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 0) {
    return formatDateSimple(date);
  }

  const diffInMinutes = Math.round(diffInSeconds / 60);
  const diffInHours = Math.round(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return '刚刚';
  }
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, 'minute');
  }
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, 'hour');
  }
  if (diffInDays === 1) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `昨天 ${hours}:${minutes}`;
  }
  if (diffInDays < 7) {
    return rtf.format(-diffInDays, 'day');
  }
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}


// --- 新增函数 ---
/**
 * 格式化时间为 HH:mm 格式
 * 这是 MessageBubble.vue 需要的函数。
 * @param {string | Date} dateInput - 可以是ISO 8601格式的字符串或Date对象
 * @returns {string} 格式化后的时间，如 "14:30"
 */
export function formatTime(dateInput) {
    if (!dateInput) return '';

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
}