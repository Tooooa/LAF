<template>
  <div class="notifications-page">
    <h2>系统通知</h2>

    <div v-if="loading" class="status-view">正在加载通知...</div>
    <div v-else-if="error" class="status-view error">加载失败: {{ error }}</div>
    <div v-else-if="notifications.length === 0" class="status-view">
      你还没有任何通知哦～
    </div>

    <div v-else class="notification-list">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="notification-item"
        :class="{ 'is-read': notification.status === 'read' }"
      >
        <div class="notification-icon">
          <!-- 可以根据 notification.type 显示不同图标 -->
          <span v-if="notification.type === 'system'">⚙️</span>
          <span v-else-if="notification.type === 'message'">✉️</span>
          <span v-else-if="notification.type === 'match'">🎯</span>
        </div>
        <div class="notification-content">
          <div class="header">
            <h3 class="title">{{ notification.title }}</h3>
            <span class="time">{{ formatTime(notification.created_at) }}</span>
          </div>
          <p class="content-text">{{ notification.content }}</p>
        </div>
        <div class="notification-actions">
          <button 
            v-if="notification.status === 'unread'" 
            @click="handleMarkAsRead(notification)"
            class="action-button read-button"
            title="标记为已读"
          >
            ✔️
          </button>
          <button 
            @click="handleDelete(notification)"
            class="action-button delete-button"
            title="删除通知"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getNotifications, markNotificationAsRead, deleteNotification } from '@/api/notifications';
import { useUserStore } from '@/store/user.js'; 

// --- 状态 ---
const notifications = ref([]);
const loading = ref(true);
const error = ref(null);
const userStore = useUserStore();

const currentUserId = userStore.user.id; 

// --- 方法 ---

// 获取通知列表
const fetchNotifications = async () => {
  loading.value = true;
  error.value = null;
  try {
    // console.log('[DEBUG]: userId: ', currentUserId);
    const res = await getNotifications({ userId: currentUserId });
    // console.log('[DEBUG]: notis response: ', res);
    if (res) {
      notifications.value = res;
    } else {
      throw new Error(res.message || '获取通知失败');
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// 标记为已读
const handleMarkAsRead = async (notification) => {
  // 乐观更新UI，立即改变状态，提升用户体验
  notification.status = 'read'; 

  try {
    await markNotificationAsRead({
      notificationId: notification.id,
      userId: currentUserId.value,
    });
    // API调用成功，无需额外操作
  } catch (err) {
    // 如果API调用失败，将状态恢复，并提示用户
    notification.status = 'unread';
    alert('标记已读失败，请重试');
    console.error('标记已读API失败:', err);
  }
};

// 删除通知
const handleDelete = async (notification) => {
  if (!confirm(`确定要删除通知：“${notification.title}”吗？`)) {
    return;
  }
  
  const originalIndex = notifications.value.findIndex(n => n.id === notification.id);
  // 乐观更新UI，立即从列表中移除
  notifications.value = notifications.value.filter(n => n.id !== notification.id);

  try {
    await deleteNotification({
      notificationId: notification.id,
      userId: currentUserId.value,
    });
  } catch (err) {
    // API调用失败，将项插回原位，并提示用户
    if (originalIndex !== -1) {
      notifications.value.splice(originalIndex, 0, notification);
    }
    alert('删除失败，请重试');
    console.error('删除通知API失败:', err);
  }
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  // 可以使用更强大的库如 day.js 或 date-fns
  return new Date(timeStr).toLocaleString('zh-CN', { hour12: false });
};

// --- 生命周期 ---
onMounted(() => {
  fetchNotifications();
});
</script>

<style scoped>
.notifications-page {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  font-family: sans-serif;
}
.page-title {
  text-align: center;
  margin-bottom: 24px;
}
.status-view {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 1.2rem;
}
.status-view.error {
  color: #d9534f;
}
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.notification-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #eee;
  transition: all 0.3s ease;
}
.notification-item.is-read {
  background-color: #f7f7f7;
  opacity: 0.7;
}
.notification-item.is-read .title,
.notification-item.is-read .content-text {
  color: #666;
}
.notification-icon {
  font-size: 24px;
}
.notification-content {
  flex-grow: 1;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}
.time {
  font-size: 0.75rem;
  color: #999;
}
.content-text {
  font-size: 0.9rem;
  color: #333;
  margin: 0;
}
.notification-actions {
  display: flex;
  gap: 8px;
}
.action-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}
.action-button:hover {
  background-color: #f0f0f0;
}
</style>