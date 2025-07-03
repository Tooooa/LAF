// src/store/user.js

import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  // 1. State 已更新
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    accessToken: localStorage.getItem('accessToken') || null,
  }),

  // 2. Getters 已更新
  getters: {
    isLoggedIn: (state) => !!state.accessToken && !!state.user,
    username: (state) => state.user?.username || '未登录',
    userId: (state) => state.user?.id || null
  },

  // 3. Actions 已更新
  actions: {
    /**
     * 登录成功后调用，持久化用户信息、accessToken 和 refreshToken
     * @param {object} data - 包含 user, accessToken, refreshToken 的对象
     */
    loginSuccess({ user, accessToken, refreshToken }) {
      this.user = user;
      this.accessToken = accessToken;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },

    /**
     * 用户登出，清除所有相关状态和本地存储
     */
    logout() {
      this.user = null;
      this.accessToken = null;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // 如果有后端登出接口，也应在此调用
    },

    /**
     * 更新用户信息（例如修改头像、昵称等）
     * @param {object} newUserData - 包含需要更新字段的对象
     */
    updateUser(newUserData) {
      // 合并数据，实现局部更新
      this.user = { ...this.user, ...newUserData };
      localStorage.setItem('user', JSON.stringify(this.user));
    }
  },
});