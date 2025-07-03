// src/api/auth.js

import request from '@/utils/request.js';

/**
 * 用户登录
 * @param {object} data - 包含 username 和 password 的对象
 * @returns Promise
 */
export function login(data) {
  return request({
    url: '/auth/login', // 对应 api_design.md 中的 3.2
    method: 'post',
    data: data
  });
}

/**
 * 用户注册
 * @param {object} data - 包含 username, phone, email, password, confirmPassword 的对象
 * @returns Promise
 */
export function register(data) {
  return request({
    url: '/auth/register', // 对应 api_design.md 中的 3.1
    method: 'post',
    data: data
  });
}