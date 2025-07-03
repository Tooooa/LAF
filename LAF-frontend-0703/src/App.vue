<!-- src/App.vue -->
<template>
  <div id="app">
    <GlobalNavbar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import GlobalNavbar from '@/components/GlobalNavbar.vue';
</script>

<style>
/* 全局样式 */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.main-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 其他你需要的全局样式 */
</style>