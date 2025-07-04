<template>
  <div class="messages-layout">
    <!-- ======================= 左侧对话列表 ======================= -->
    <div class="conversation-list-panel">
      <h2 class="panel-title">我的消息</h2>
      
      <div v-if="messageStore.isLoading && !messageStore.conversations.length" class="panel-state">
        加载中...
      </div>
      <div v-else-if="!messageStore.conversations.length" class="panel-state">
        没有消息
      </div>
      
      <div v-else class="conversation-list">
        <ConversationListItem
          v-for="conv in messageStore.conversations"
          :key="conv.id"
          :conversation="conv"
          :is-active="conv.id === messageStore.activeConversationId"
          @click="selectConversation(conv.id)"
        />
      </div>
    </div>

    <!-- ======================= 右侧聊天窗口 ======================= -->
    <div class="chat-window-panel">
      <!-- 直接检查 activeConversation 对象是否存在 -->
      <div v-if="activeConversation" class="chat-container">
        
        <div class="chat-header">
          <h3 v-if="activeConversation.participant">{{ activeConversation.participant.username }}</h3>
          <p v-if="activeConversation.item">关于物品: {{ activeConversation.item.title }}</p>
        </div>
        
        <div class="messages-area" ref="messagesArea">
          <div v-if="messageStore.isLoading && !activeConversation" class="panel-state">正在加载...</div>
          <MessageBubble
            v-for="msg in messageStore.activeConversationMessages"
            :key="msg.id"
            :message="msg"
            :is-self="messageStore.currentUser && msg.from_user_id === messageStore.currentUser.id"
          />
        </div>
        
        <div class="message-input-area">
          <textarea
            v-model="newMessage"
            @keydown.enter.prevent="handleSendMessage"
            placeholder="输入消息..."
            rows="1"
            ref="textareaRef"
          ></textarea>
          <button @click="handleSendMessage" :disabled="!newMessage.trim() || messageStore.isSending">
            {{ messageStore.isSending ? '发送中...' : '发送' }}
          </button>
        </div>
      </div>
      
      <div v-else class="placeholder">
        <span v-if="messageStore.isLoading">正在加载对话...</span>
        <span v-else>选择一个对话开始聊天</span>
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
const textareaRef = ref(null);

// 计算属性直接从 store.state 获取 activeConversation
const activeConversation = computed(() => messageStore.activeConversation);

const scrollToBottom = async () => {
  await nextTick();
  if (messagesArea.value) {
    messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
  }
};

const adjustTextareaHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
  }
};

const selectConversation = (id) => {
  if (id === messageStore.activeConversationId) return;
  router.push(`/messages/${id}`);
};

const handleSendMessage = async () => {
  if (!newMessage.value.trim() || messageStore.isSending) return;
  
  const messageData = {
    toUserId: Number(activeConversation.value.participant.id),
    itemId: Number(activeConversation.value.item.id),
    content: newMessage.value,
  };

  const result = await messageStore.sendNewMessage(messageData);
  if (result) {
    newMessage.value = '';
    await nextTick();
    adjustTextareaHeight();
    await scrollToBottom();
  }
};

// 核心驱动逻辑
watch(
  () => route.params.conversationId,
  (newIdStr) => {
    const newId = newIdStr ? Number(newIdStr) : "2";
    
    // 先设置 ID，这会尝试从现有列表中快速找到对话对象
    messageStore.setActiveConversationId(newId);
    
    if (newId) {
      // fetchMessages 现在会处理找不到对话的情况（比如刷新页面）
      messageStore.fetchMessages(newId).then(() => {
        scrollToBottom();
      });
    } else {
      messageStore.clearActiveConversation();
    }
  },
  { immediate: true }
);

// 监听消息列表长度变化来滚动
watch(
  () => messageStore.activeConversationMessages.length,
  () => {
    scrollToBottom();
  }
);

// 监听输入框内容变化，以调整高度
watch(newMessage, adjustTextareaHeight);

onMounted(async () => {
  if (!messageStore.conversations.length) {
    console.log('组件已挂载，开始异步获取对话列表...');
    
    // 等待数据获取完成
    await messageStore.fetchConversations();
    
    // await 执行完毕后，可以安全地访问已填充的数据
    console.log('数据已到达！可以执行后续逻辑了。当前对话列表:', messageStore.conversations);
  }
});
</script>

<style scoped>
.messages-layout {
  display: flex;
  height: calc(100vh - 80px); /* 假设导航栏高度为 80px */
  border: 1px solid #e0e0e0;
  background-color: #f9f9f9;
}

.conversation-list-panel {
  width: 320px;
  flex-shrink: 0;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.chat-window-panel {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-title {
  padding: 16px;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fff;
}

.panel-state {
  padding: 20px;
  text-align: center;
  color: #888;
}

.conversation-list {
  overflow-y: auto;
  flex-grow: 1;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 1.1rem;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fff;
  flex-shrink: 0;
}
.chat-header h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
}
.chat-header p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.messages-area {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-input-area {
  display: flex;
  align-items: center;
  padding: 10px;
  border-top: 1px solid #e0e0e0;
  background-color: #fff;
  flex-shrink: 0;
}
.message-input-area textarea {
  flex-grow: 1;
  border: 1px solid #ccc;
  border-radius: 18px;
  padding: 8px 16px;
  resize: none;
  font-size: 1rem;
  line-height: 1.5;
  max-height: 120px; /* 限制最大高度 */
  overflow-y: auto;
  transition: height 0.2s ease;
}
.message-input-area button {
  margin-left: 10px;
  padding: 8px 20px;
  background-color: #1a73e8;
  color: white;
  border: none;
  border-radius: 18px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}
.message-input-area button:hover {
  background-color: #1665c9;
}
.message-input-area button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>