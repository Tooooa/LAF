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