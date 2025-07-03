import axios from 'axios';
// 如果使用UI库，可以引入Message组件用于提示
// import { Message } from 'element-ui'; 

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// --- 添加请求拦截器 ---
service.interceptors.request.use(
  config => {
    // 从存储中获取token
    const token = localStorage.getItem('accessToken'); // 示例: 从localStorage获取
    if (token) {
      // 为请求头添加 Authorization
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// --- 修改响应拦截器 ---
service.interceptors.response.use(
  /**
   * 成功的响应会进入这里
   */
  response => {
    const res = response.data;

    // 使用 'success' 字段判断业务是否成功，更符合API设计
    if (!res.success) {
      // Message({ message: res.message || 'Error', type: 'error' });
      console.error('API Business Error:', res.message);

      // 特殊错误码处理，例如 token 失效的另一种情况 (如果后端在业务码中体现)
      // if (res.code === 40101) { ... }
      
      return Promise.reject(new Error(res.message || 'Error'));
    } else {
      // 成功，直接返回后端数据中的 'data' 字段，简化调用
      return res.data;
    }
  },
  /**
   * 失败的响应会进入这里 (网络错误, HTTP状态码非2xx)
   */
  error => {
    console.error('HTTP Network Error:', error);
    let message = error.message;

    if (error.response) {
      const { status, data } = error.response;
      // 根据HTTP状态码进行不同的处理
      switch (status) {
        case 401:
          message = '认证失败，请重新登录';
          // 此处应执行登出操作，例如清除本地token，跳转登录页
          // store.dispatch('user/logout');
          // window.location.href = '/login';
          break;
        case 403:
          message = '权限不足，无法访问';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 500:
          message = '服务器内部错误，请稍后再试';
          break;
        default:
          message = data?.message || `请求失败 (状态码 ${status})`;
      }
    }
    // Message({ message: message, type: 'error' });
    return Promise.reject(error);
  }
);

export default service;