<template>
  <nav class="global-navbar">
    <div class="navbar-left">
      <router-link to="/" class="logo">
        <img src="@/assets/logo.svg" alt="Logo" />
        <span>首页</span>
      </router-link>

      <div class="nav-links">
        <router-link to="/items" class="nav-link">物品广场</router-link>
        <!-- <router-link to="/items?type=found" class="nav-link">招领广场</router-link> -->
        <router-link to="/map" class="nav-link">地图模式</router-link>
      </div>
    </div>

    <div class="navbar-right">
      <router-link to="/publish" class="publish-button">
        <i class="plus-icon">+</i> 发布信息
      </router-link>

      <div class="user-area">
        <div v-if="isLoggedIn" class="user-profile" @click="toggleMenu">
          <img :src="userAvatar" alt="avatar" class="avatar" />
          <span class="username">{{ username }}</span>
          <i :class="['arrow', { 'up': isMenuVisible }]"></i>

          <ul v-if="isMenuVisible" class="user-menu" @click.stop>
            <li><router-link to="/dashboard">个人中心</router-link></li>
            <li><a href="#" @click.prevent="handleLogout">退出登录</a></li>
          </ul>
        </div>

        <div v-else>
          <button class="login-button" @click="goToLogin">登录 / 注册</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
// 温馨提示: 请确保在 @/assets/ 目录下有一个用作默认头像的图片文件
import defaultAvatar from '@/assets/default-image.png';

const router = useRouter();
const userStore = useUserStore();

const isMenuVisible = ref(false);

// 从 Pinia Store 获取登录状态和用户信息 (已使用 userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn);
const username = computed(() => userStore.user?.username || '用户');
const userAvatar = computed(() => userStore.user?.avatar || defaultAvatar);

const toggleMenu = () => {
  isMenuVisible.value = !isMenuVisible.value;
};

// 跳转逻辑 (已使用您指定的命名路由)
const goToLogin = () => {
  router.push({ name: 'Auth' });
};

const handleLogout = () => {
  userStore.logout();
  isMenuVisible.value = false; // 关闭菜单
  router.push({ name: 'Home' }); // 跳转到首页
};

// 点击菜单外部，自动关闭菜单的逻辑
const handleClickOutside = (event) => {
    if (isMenuVisible.value && !event.target.closest('.user-profile')) {
        isMenuVisible.value = false;
    }
};
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

</script>

<style scoped>
/* 使用图片中的配色方案美化导航栏 */
.global-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 2rem;
  background: linear-gradient(135deg, #1F2544 0%, #474F7A 50%, #81689D 100%);
  box-shadow: 0 4px 20px rgba(31, 37, 68, 0.15);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.navbar-left, .navbar-right, .nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #FFD0EC;
  font-weight: 700;
  font-size: 1.3rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
  color: #ffffff;
}

.logo img {
  height: 36px;
  margin-right: 0.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.nav-link {
  text-decoration: none;
  color: #FFD0EC;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.nav-link:hover::before {
  left: 100%;
}

.nav-link:hover,
.nav-link.router-link-exact-active {
  color: #ffffff;
  background: rgba(255, 208, 236, 0.15);
  backdrop-filter: blur(5px);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 208, 236, 0.3);
}

.nav-link.router-link-exact-active {
  background: rgba(255, 208, 236, 0.25);
}

.publish-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.5rem;
  background: linear-gradient(135deg, #81689D 0%, #FFD0EC 100%);
  color: #1F2544;
  border: none;
  border-radius: 25px;
  text-decoration: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(129, 104, 157, 0.4);
}

.publish-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(129, 104, 157, 0.6);
  background: linear-gradient(135deg, #FFD0EC 0%, #81689D 100%);
  color: #ffffff;
}

.plus-icon {
  font-weight: bold;
  font-size: 1.1rem;
}

.user-area {
  position: relative;
}

.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  transition: all 0.3s ease;
}

.user-profile:hover {
  background: rgba(255, 208, 236, 0.15);
  backdrop-filter: blur(5px);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #FFD0EC;
  box-shadow: 0 2px 8px rgba(255, 208, 236, 0.3);
  transition: all 0.3s ease;
}

.avatar:hover {
  border-color: #ffffff;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.4);
}

.username {
  font-weight: 500;
  color: #FFD0EC;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.arrow {
  border: solid #FFD0EC;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transform: rotate(45deg);
  -webkit-transform: rotate(45deg);
  transition: all 0.3s ease;
}

.arrow.up {
  transform: rotate(-135deg);
}

.user-menu {
  position: absolute;
  top: 130%;
  right: 0;
  background: linear-gradient(135deg, #474F7A 0%, #81689D 100%);
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(31, 37, 68, 0.3);
  list-style: none;
  padding: 0.5rem 0;
  margin: 0;
  width: 180px;
  z-index: 1001;
  border: 1px solid rgba(255, 208, 236, 0.3);
  backdrop-filter: blur(10px);
}

.user-menu li a {
  display: block;
  padding: 0.75rem 1rem;
  color: #FFD0EC;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
}

.user-menu li a:hover {
  background: rgba(255, 208, 236, 0.2);
  color: #ffffff;
  transform: translateX(5px);
}

.login-button {
  padding: 0.7rem 1.5rem;
  background: transparent;
  color: #FFD0EC;
  border: 2px solid #FFD0EC;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.login-button:hover {
  background: #FFD0EC;
  color: #1F2544;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 208, 236, 0.4);
}

/* 添加一些动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-menu {
  animation: fadeIn 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .global-navbar {
    padding: 0 1rem;
  }
  
  .navbar-left, .navbar-right, .nav-links {
    gap: 1rem;
  }
  
  .logo {
    font-size: 1.1rem;
  }
  
  .nav-link {
    padding: 0.4rem 0.8rem;
  }
  
  .publish-button {
    padding: 0.6rem 1.2rem;
  }
}
</style>