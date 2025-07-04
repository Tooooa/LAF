<template>
  <div class="message-bubble" :class="{ 'is-sender': isSender }">
    <div class="bubble">
      <p>{{ message.content }}</p>
      <span class="timestamp">{{ formattedTimestamp }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/store/user'; // 引入你的用户 store
import { formatTime } from '@/utils/date'; // 假设你有时间格式化工具

const props = defineProps({
  message: {
    type: Object,
    required: true,
  }
});

const userStore = useUserStore();
const isSender = computed(() => props.message.fromUser.id === userStore.user.id);

const formattedTimestamp = computed(() => {
  // 假设你的日期工具里有格式化时间的方法
  return formatTime(props.message.createdAt); 
});
</script>

<style scoped>
.message-bubble { display: flex; margin-bottom: 10px; }
.is-sender { justify-content: flex-end; }
.bubble { max-width: 70%; padding: 10px 15px; border-radius: 18px; position: relative; }
.is-sender .bubble { background-color: #4CAF50; color: white; border-bottom-right-radius: 4px; }
.message-bubble:not(.is-sender) .bubble { background-color: #f1f0f0; color: black; border-bottom-left-radius: 4px; }
.bubble p { margin: 0 0 5px 0; }
.timestamp { font-size: 0.7em; color: rgba(255,255,255,0.7); display: block; text-align: right; }
.message-bubble:not(.is-sender) .timestamp { color: #999; }
</style>