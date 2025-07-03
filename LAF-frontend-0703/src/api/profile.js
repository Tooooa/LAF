import request from '@/utils/request';

/**
 * 获取用户个人资料
 * @param {number} id - 用户ID
 * @returns {Promise<Object>} 包含用户资料的Promise
 */
export const getProfile = (id) => {
  return request({
    url: '/profile',
    method: 'get',
    params: id, // 传递用户ID作为查询参数
  });
};

/**
 * 更新用户基本信息
 * @param {number} id - 用户ID
 * @param {Object} data - 更新数据 { username?, avatar? }
 * @returns {Promise<Object>} 更新结果的Promise
 */
export const updateProfile = (id, data) => {
  return request({
    url: '/profile',
    method: 'patch',
    params: { id }, // ID作为查询参数
    data, // 更新数据放在请求体
  });
};

/**
 * 更新用户密码
 * @param {number} id - 用户ID
 * @param {Object} data - 密码数据 { oldPassword, newPassword }
 * @returns {Promise<Object>} 更新结果的Promise
 */
export const updatePassword = (id, data) => {
  return request({
    url: '/profile/password',
    method: 'post',
    params: { id }, // ID作为查询参数
    data, // 密码数据放在请求体
  });
};