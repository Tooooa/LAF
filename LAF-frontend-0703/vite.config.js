// vite.config.js

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path'; // 引入 path 模块

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  // 1. 路径别名配置，这个部分保持不变
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },

  // // 2. 开发服务器代理配置
  // server: {
  //   proxy: {
  //     // 把所有 /api 开头的请求都代理到 json-server
  //     '/api': {
  //       target: 'http://localhost:4000', // 指向 json-server
  //       changeOrigin: true,
  //       // 重写路径：把请求中 /api 去掉，因为 json-server 的路径里没有 /api
  //       // 例如：/api/items -> /items
  //       rewrite: (path) => path.replace(/^\/api/, ''), 
  //     },
  //     // 你可以把旧的 /items 和 /users 规则删掉
  //   }
  // }
});