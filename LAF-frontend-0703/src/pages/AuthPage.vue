<!-- src/pages/AuthPage.vue -->
<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-tabs">
        <h2 
          :class="{ active: activeTab === 'login' }" 
          @click="activeTab = 'login'">
          登录
        </h2>
        <h2 
          :class="{ active: activeTab === 'register' }" 
          @click="activeTab = 'register'">
          注册
        </h2>
      </div>

      <!-- 登录表单 -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="login-username">用户名</label>
          <input id="login-username" type="text" v-model="loginForm.username" required placeholder="请输入用户名">
        </div>
        <div class="form-group">
          <label for="login-password">密码</label>
          <input id="login-password" type="password" v-model="loginForm.password" required placeholder="请输入密码">
        </div>
        <button type="submit" class="auth-button">登录</button>
      </form>

      <!-- 注册表单 -->
      <form v-if="activeTab === 'register'" @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="reg-username">用户名</label>
          <input id="reg-username" type="text" v-model="registerForm.username" required placeholder="请输入用户名">
        </div>
        <div class="form-group">
          <label for="reg-phone">手机号</label>
          <input id="reg-phone" type="tel" v-model="registerForm.phone" required placeholder="请输入手机号">
        </div>
        <div class="form-group">
          <label for="reg-email">邮箱</label>
          <input id="reg-email" type="email" v-model="registerForm.email" required placeholder="请输入邮箱">
        </div>
        <div class="form-group">
          <label for="reg-password">密码</label>
          <input id="reg-password" type="password" v-model="registerForm.password" required placeholder="请输入密码">
        </div>
        <div class="form-group">
          <label for="reg-confirm-password">确认密码</label>
          <input id="reg-confirm-password" type="password" v-model="registerForm.confirmPassword" required placeholder="请再次输入密码">
        </div>
        <button type="submit" class="auth-button">注册</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user.js';
import { login, register } from '@/api/auth.js';

// 获取 router 和 pinia store 实例
const router = useRouter();
const userStore = useUserStore();

// 控制登录/注册Tab的显示
const activeTab = ref('login');

// 登录表单数据
const loginForm = ref({
  username: '',
  password: ''
});

// 注册表单数据 (根据 api_design.md 定义)
const registerForm = ref({
  username: '',
  phone: '',
  password: '',
  confirmPassword: '',
  email: ''
});

// 处理登录逻辑
const handleLogin = async () => {
  try {
    const response = await login(loginForm.value);
    console.log('[DE]: response: ', response);
    if (response.code == 200) {
      // 调用 Pinia store 中的 action 保存用户信息
      userStore.loginSuccess({
        user: response.user,       // 用户信息
        accessToken: response.token, // token
        refreshToken: response.refreshToken // 如果有的话
      });
      alert('登录成功！');
      // 登录成功后跳转到首页
      router.push('/');
    } else {
      // 显示后端返回的错误信息
      alert(`登录失败: ${response.message}`);
    }
  } catch (error) {
    console.error('登录请求失败:', error);
    alert('登录失败，请检查网络或联系管理员。');
  }
};

// 处理注册逻辑
const handleRegister = async () => {
  // 简单的前端验证
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    alert('两次输入的密码不一致！');
    return;
  }
  
  try {
    const response = await register(registerForm.value);
    if (response.success) {
      alert('注册成功，请登录！');
      // 注册成功后切换到登录Tab，并清空注册表单
      activeTab.value = 'login';
      registerForm.value = { username: '', phone: '', password: '', confirmPassword: '', email: '' };
    } else {
      alert(`注册失败: ${response.message}`);
    }
  } catch (error) {
    console.error('注册请求失败:', error);
    alert('注册失败，请检查网络或联系管理员。');
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.auth-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.auth-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.auth-tabs h2 {
  font-size: 24px;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  padding: 0 20px;
  position: relative;
}

.auth-tabs h2.active {
  color: #333;
}

.auth-tabs h2.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 20px;
  right: 20px;
  height: 3px;
  background-color: #409EFF; /* 或者你的主题色 */
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.auth-button {
  width: 100%;
  padding: 12px;
  background-color: #409EFF; /* 或者你的主题色 */
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.auth-button:hover {
  background-color: #66b1ff;
}
</style>