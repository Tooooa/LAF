<template>
  <div class="messages-layout">
    <!-- 左侧对话列表 -->
    <div class="conversation-list-panel">
      <h2 class="panel-title">我的消息</h2>
      <div v-if="messageStore.isLoading && !messageStore.conversations.length">加载中...</div>
      <div v-else-if="!messageStore.conversations.length">没有消息</div>
      <ConversationListItem
        v-for="conv in messageStore.conversations"
        :key="conv.id"
        :conversation="conv"
        :is-active="conv.id === messageStore.activeConversationId"
        @click="selectConversation(conv.id)"
      />
    </div>

    <!-- 右侧聊天窗口 -->
    <div class="chat-window-panel">
      <div v-if="!messageStore.activeConversationId" class="placeholder">
        选择一个对话开始聊天
      </div>
      <div v-else class="chat-container">
        <!-- 聊天窗口头部 -->
        <div class="chat-header">
          <h3>{{ activeConversation.participant.username }}</h3>
          <p>关于物品: {{ activeConversation.item.title }}</p>
        </div>
        <!-- 消息区域 -->
        <div class="messages-area" ref="messagesArea">
          <div v-if="messageStore.isLoading">正在加载消息...</div>
          <MessageBubble
            v-for="msg in messageStore.activeConversationMessages"
            :key="msg.id"
            :message="msg"
          />
        </div>
        <!-- 消息输入框 -->
        <div class="message-input-area">
          <textarea
            v-model="newMessage"
            @keydown.enter.prevent="handleSendMessage"
            placeholder="输入消息..."
          ></textarea>
          <button @click="handleSendMessage" :disabled="!newMessage.trim()">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessageStore } from '@/store/messages';
import ConversationListItem from '@/components/ConversationListItem.vue';
import MessageBubble from '@/components/MessageBubble.vue';

const route = useRoute();
const router = useRouter();
const messageStore = useMessageStore();
const newMessage = ref('');
const messagesArea = ref(null);

// 计算属性获取当前对话
const activeConversation = computed(() => messageStore.activeConversation);

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (messagesArea.value) {
    messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
  }
};

// 选择一个对话
const selectConversation = (id) => {
  if (id === messageStore.activeConversationId) return;
  router.push(`/messages/${id}`);
};

// 发送消息
const handleSendMessage = async () => {
  if (!newMessage.value.trim()) return;
  
  const messageData = {
    toUserId: activeConversation.value.participant.id,
    itemId: activeConversation.value.item.id,
    content: newMessage.value,
  };

  await messageStore.sendNewMessage(messageData);
  newMessage.value = '';
  await scrollToBottom();
};

// 监听路由参数变化
watch(
  () => route.params.conversationId,
  (newId) => {
    if (newId) {
      messageStore.fetchMessages(Number(newId)).then(() => {
        scrollToBottom();
      });
    } else {
      messageStore.clearActiveConversation();
    }
  },
  { immediate: true }
);

// 监听新消息，并滚动
watch(() => messageStore.activeConversationMessages, () => {
  scrollToBottom();
}, { deep: true });

onMounted(() => {
  // 页面加载时，获取所有对话列表
  messageStore.fetchConversations();
});
</script>

<style scoped>
.messages-layout { display: flex; height: calc(100vh - 80px); /* 减去导航栏高度 */ border: 1px solid #ccc; }
.conversation-list-panel { width: 300px; border-right: 1px solid #ccc; overflow-y: auto; }
.chat-window-panel { flex-grow: 1; display: flex; flex-direction: column; }
.panel-title { padding: 15px; margin: 0; border-bottom: 1px solid #ccc; }
.placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: #999; }
.chat-container { display: flex; flex-direction: column; height: 100%; }
.chat-header { padding: 15px; border-bottom: 1px solid #ccc; }
.chat-header h3, .chat-header p { margin: 0; }
.messages-area { flex-grow: 1; padding: 20px; overflow-y: auto; }
.message-input-area { display: flex; padding: 10px; border-top: 1px solid #ccc; }
.message-input-area textarea { flex-grow: 1; border: 1px solid #ddd; border-radius: 5px; padding: 10px; resize: none; }
.message-input-area button { margin-left: 10px; padding: 10px 20px; background-color: #1a73e8; color: white; border: none; border-radius: 5px; cursor: pointer; }
.message-input-area button:disabled { background-color: #ccc; }
</style>