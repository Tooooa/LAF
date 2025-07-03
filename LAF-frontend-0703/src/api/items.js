import request from '@/utils/request'; // 确保你已经封装好了 request 工具

/**
 * 获取物品列表
 * @param {object} params - 查询参数对象，例如 { page: 1, limit: 10, category: 'electronics', status: 'active' }
 * @returns {Promise}
 */
export function getItems(params) {
  return request({
    url: '/items',
    method: 'get',
    params, // axios 会自动将 params 对象转换成 URL 查询字符串，如 ?page=1&limit=10
  });
}

/**
 * 根据ID获取单个物品的详细信息
 * @param {string | number} itemId - 物品的ID
 * @returns {Promise}
 */
export function getItemById(itemId) {
  return request({
    url: `/items/${itemId}`, // 使用模板字符串拼接ID到URL中
    method: 'get',
  });
}

/**
 * 获取物品列表（支持分页、排序、筛选）
 * @param {Object} params - 查询参数对象
 * @param {string} params.type - 物品类型 ('lost' | 'found')
 * @param {number} [params.pageSize=10] - 每页条数（可选，默认10）
 * @param {string} [params.sortBy='createdAt'] - 排序字段（可选，默认按创建时间）
 * @param {string} [params.sortOrder='desc'] - 排序方式 ('asc' | 'desc')（可选，默认降序）
 * @returns {Promise<{success: boolean, data: {items: Array, total: number}}>} 
 *          返回Promise，解析后包含物品列表和总数
 */
export const getItemsList = (params) => {
  // 默认参数（避免调用时遗漏必填字段）
  const defaultParams = {
    type: 'lost', // todo: 这个参数是否必须？
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  // 合并用户参数与默认参数
  const requestParams = { ...defaultParams, ...params };

  // 发起请求（GET方法，参数拼接到URL的query string）
  return request({
    url: '/items',
    method: 'get',
    params: requestParams, // Axios会自动将对象转换为 ?type=lost&pageSize=6...
  });
};

/**
 * 发布新物品
 * @param {Object} itemData - 物品数据
 * @returns {Promise<Object>}
 */
export const createItem = (itemData) => {
  return request({
    url: '/items',
    method: 'post',
    data: itemData,
  });
};

/**
 * 更新物品信息
 * @param {string|number} itemId - 物品ID
 * @param {Object} itemData - 更新的物品数据
 * @returns {Promise<Object>}
 */
export const updateItem = (itemId, itemData) => {
  return request({
    url: `/items/${itemId}`,
    method: 'put',
    data: itemData,
  });
};

/**
 * 更新物品状态 (例如：标记为已找回)
 * @param {string|number} itemId - 物品ID
 * @param {Object} statusData - 包含 status 和 note 的对象
 * @returns {Promise<Object>}
 */
export const updateItemStatus = (itemId, statusData) => {
  return request({
    url: `/items/${itemId}/status`,
    method: 'put',
    data: statusData,
  });
};

/**
 * 智能搜索
 * @param {Object} searchData - 包含 { query: '搜索内容' } 的对象
 * @returns {Promise<Object>}
 */
export const intelligentSearch = (searchData) => {
  return request({
    url: '/search/intelligent',
    method: 'post',
    data: searchData,
  });
};

