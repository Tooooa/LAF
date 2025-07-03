<!-- src/pages/UserDashboardPage.vue -->
<template>
  <div class="dashboard-container">
    <aside class="dashboard-nav">
      <div class="user-profile">
        <img :src="user.avatar || defaultAvatar" alt="User Avatar" class="avatar">
        <h3 class="username">{{ user.username }}</h3>
      </div>
      <nav class="menu">
        <router-link to="/dashboard/posts" class="menu-item" active-class="active">我发布的</router-link>
        <router-link to="/dashboard/messages" class="menu-item" active-class="active">我的消息</router-link>
        <router-link to="/dashboard/notifications" class="menu-item" active-class="active">系统通知</router-link>
        <router-link to="/dashboard/settings" class="menu-item" active-class="active">个人资料</router-link>
      </nav>
      <button @click="logout" class="logout-button">退出登录</button>
    </aside>
    <main class="dashboard-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user'; // 使用 Pinia
import defaultAvatar from '@/assets/default-image.png'; // 引入默认头像

const userStore = useUserStore();
const router = useRouter();

const user = computed(() => userStore.user || {});

const logout = () => {
  userStore.logout();
  router.push({ name: 'Home' });
};
</script>

<style scoped>
.dashboard-container {
  display: flex;
  max-width: 1200px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-height: 80vh;
}

.dashboard-nav {
  width: 240px;
  flex-shrink: 0;
  background-color: #f8f9fa;
  border-right: 1px solid #e9ecef;
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-profile {
  text-align: center;
  margin-bottom: 2rem;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.5rem;
  border: 3px solid #dee2e6;
}

.username {
  font-size: 1.2rem;
  font-weight: 600;
  color: #343a40;
}

.menu {
  width: 100%;
}

.menu-item {
  display: block;
  padding: 1rem 1.5rem;
  color: #495057;
  text-decoration: none;
  font-size: 1rem;
  transition: background-color 0.2s, color 0.2s;
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background-color: #e9ecef;
}

.menu-item.active {
  background-color: #e9f5ff;
  color: #007bff;
  font-weight: 600;
  border-left-color: #007bff;
}

.logout-button {
  margin-top: auto;
  padding: 0.75rem 1.5rem;
  background-color: #f1f3f5;
  border: 1px solid #ced4da;
  border-radius: 5px;
  cursor: pointer;
  color: #dc3545;
  font-weight: 500;
}

.logout-button:hover {
  background-color: #e9ecef;
}


.dashboard-content {
  flex-grow: 1;
  padding: 2rem;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>