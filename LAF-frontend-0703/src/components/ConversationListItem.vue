<template>
  <!-- 只有当 conversation 对象本身和其关键子对象都存在时才渲染 -->
  <div v-if="conversation && conversation.participant && conversation.item && conversation.lastMessage" 
       class="conversation-item" :class="{ active: isActive }">
       
    <!-- 确保 participant 存在才渲染 avatar -->
    <img :src="conversation.participant.avatar" alt="avatar" class="avatar" />
    
    <div class="conversation-details">
      <div class="header">
        <span class="username">{{ conversation.participant.username }}</span>
        <!-- 确保 lastMessage 存在才格式化时间 -->
        <span class="timestamp">{{ formattedTimestamp }}</span>
      </div>
      
      <!-- 确保 item 存在 -->
      <div class="item-info">
        关于: {{ conversation.item.title }}
      </div>
      
      <!-- 确保 lastMessage 存在 -->
      <div class="last-message">
        <p>{{ conversation.lastMessage.content }}</p>
        <span v-if="conversation.unreadCount > 0" class="unread-badge">{{ conversation.unreadCount }}</span>
      </div>
    </div>
  </div>
  
  <!-- （可选）如果数据不完整，可以显示一个占位符或直接不渲染任何东西 -->
  <div v-else class="conversation-item-placeholder">
    <!-- 数据加载中或格式错误... -->
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatRelativeTime } from '@/utils/date'; // 假设你有这样一个日期格式化工具

const props = defineProps({
  conversation: {
    type: Object,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  }
});

const formattedTimestamp = computed(() => {
  return formatRelativeTime(props.conversation.lastMessage.createdAt);
});
</script>

<style scoped>
/* 添加样式，例如激活状态的背景色，未读消息红点等 */
.conversation-item { display: flex; padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; }
.conversation-item.active { background-color: #f0f0f0; }
.conversation-item:hover { background-color: #f9f9f9; }
.avatar { width: 50px; height: 50px; border-radius: 50%; margin-right: 10px; }
.conversation-details { flex-grow: 1; }
.header { display: flex; justify-content: space-between; }
.username { font-weight: bold; }
.timestamp { font-size: 0.8em; color: #999; }
.item-info { font-size: 0.9em; color: #666; margin: 2px 0; }
.last-message { display: flex; justify-content: space-between; align-items: center; }
.last-message p { margin: 0; font-size: 0.9em; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.unread-badge { background-color: red; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.7em; }
</style>