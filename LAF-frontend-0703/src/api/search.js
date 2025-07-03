import axios from 'axios';

// 配置你的API基础URL
const apiClient = axios.create({
  baseURL: 'http://localhost:4000/v1', // 后端API地址
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * 调用智能解析API
 * @param {object} payload - { query: string }
 * @returns {Promise<object>}
 */
export const parseIntelligentQuery = async (payload) => {
  try {
    const response = await apiClient.post('/intelli-parse', payload);
    return response; // 后端应返回 { success: boolean, data: { filters: {...} } }
  } catch (error) {
    console.error('API call to /intelli-parse failed:', error);
    // 即使API失败，也返回一个标准的失败结构，让组件可以处理
    return { success: false, message: error.message };
  }
};

/**
 * 根据条件获取物品列表（用于列表页和首页最新列表）
 * @param {object} params - 例如 { type: 'lost', limit: 4, keyword: '耳机' }
 * @returns {Promise<object>}
 */
export const fetchLatestItems = async (params) => {
  try {
    // 使用 GET 请求，并通过 params 传递查询参数
    const response = await apiClient.get('/items', { params }); 
    return response; // 后端应返回 { success: boolean, data: [...] }
  } catch (error) {
    console.error('API call to /items failed:', error);
    return { success: false, message: error.message };
  }
};