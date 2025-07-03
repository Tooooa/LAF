<!-- src/pages/dashboard/MyMessages.vue -->
<template>
  <div>
    <h2>我的消息</h2>
    <!-- 这里调用 GET /messages/conversations 接口 -->
    <div class="placeholder">消息功能正在开发中...</div>
  </div>
</template>
<script setup>
// import { getConversations } from '@/api/messages';
// onMounted(() => { fetchConversations(); });
</script>
<style scoped>
.placeholder {
  padding: 3rem; text-align: center; color: #6c757d;
}
</style>