// src/api/locations.js
import request from '../utils/request';

/**
 * 获取地点建议
 * @param {string} query - 搜索关键词
 * @returns {Promise<Object>}
 */
export const fetchLocationSuggestions = (query) => {
  return request({
    url: '/locations/suggestions',
    method: 'get',
    params: { query, limit: 10 }, // 限制返回10个建议
  });
};

/**
 * 获取地图范围内的物品信息和热力图数据
 * @param {object} params - 查询参数, 例如 { bounds: 'lng1,lat1,lng2,lat2', type: 'lost' }
 * @returns {Promise}
 */
export function getMapItems(params) {
  return request({
    url: '/map/items',
    method: 'get',
    params,
  });
};

/**
 * 获取地图统计信息
 * @param {object} params - 查询参数, 例如 { timeRange: '30d' }
 * @returns {Promise}
 */
export function getMapStatistics(params) {
  return request({
    url: '/map/statistics',
    method: 'get',
    params,
  });
}