<template>
    <div class="profile-container">
      <h2>个人资料</h2>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <p>正在加载个人资料...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="fetchProfile">重试</button>
      </div>
      
      <!-- 数据展示 -->
      <div v-else-if="profile" class="profile-content">
        <div class="profile-header">
          <img :src="profile.avatar || defaultAvatar" alt="用户头像" class="avatar">
          <h3>{{ profile.username }}</h3>
        </div>
        
        <div class="profile-details">
          <div class="detail-item">
            <span class="label">用户ID:</span>
            <span>{{ profile.id }}</span>
          </div>
          <div class="detail-item">
            <span class="label">账号状态:</span>
            <span>{{ statusText[profile.status] }}</span>
          </div>
          <div class="detail-item">
            <span class="label">注册时间:</span>
            <span>{{ formatDate(profile.createdAt) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">最后登录:</span>
            <span>{{ profile.lastLoginAt ? formatDate(profile.lastLoginAt) : '从未登录' }}</span>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <p>未能获取到个人资料</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useUserStore } from '@/store/user';
  import { getProfile } from '@/api/profile'; 
  import defaultAvatar from '@/assets/default-image.png';

  const userStore = useUserStore();
  const profile = ref(null);
  const loading = ref(false);
  const error = ref(null);
  
  // 状态文本映射
  const statusText = {
    active: '正常',
    inactive: '未激活',
    banned: '已封禁'
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // 获取个人资料
  const fetchProfile = async () => {
    try {
      loading.value = true;
      error.value = null;
      
      // 从store获取当前用户ID
      const userId = userStore.user?.id;
      if (!userId) {
        throw new Error('未获取到用户信息，请重新登录');
      }
      
      // 调用API获取数据
      const response = await getProfile({ id: userId });
      profile.value = response;
      
    } catch (err) {
      console.error('获取个人资料失败:', err);
      error.value = err.message || '获取个人资料失败，请稍后重试';
    } finally {
      loading.value = false;
    }
  };
  
  // 组件挂载时获取数据
  onMounted(fetchProfile);
  </script>
  
  <style scoped>
  .profile-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .profile-header {
    display: flex;
    align-items: center;
    margin-bottom: 30px;
  }
  
  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-right: 20px;
    object-fit: cover;
  }
  
  .profile-details {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 8px;
  }
  
  .detail-item {
    display: flex;
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
  }
  
  .detail-item:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  
  .label {
    font-weight: bold;
    min-width: 120px;
    color: #666;
  }
  
  .loading-state,
  .error-state,
  .empty-state {
    text-align: center;
    padding: 50px 0;
    color: #666;
  }
  
  .error-state button {
    margin-top: 10px;
    padding: 5px 15px;
    background: #f56c6c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .error-state button:hover {
    background: #e64c4c;
  }
  </style>