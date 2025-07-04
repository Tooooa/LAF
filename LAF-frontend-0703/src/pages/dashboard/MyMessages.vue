<template>
  <div class="messages-page">
    <!-- 左侧对话列表 -->
    <div class="conversation-list-panel">
      <div class="panel-header">
        <h3>对话列表</h3>
        <span v-if="messagesStore.unreadCount > 0" class="unread-badge">{{ messagesStore.unreadCount }}</span>
      </div>
      <div class="list-container">
        <div v-if="isLoading" class="placeholder">加载中...</div>
        <div v-else-if="conversations.length === 0" class="placeholder">暂无对话</div>
        <ConversationListItem
          v-for="convo in conversations"
          :key="convo.id"
          :conversation="convo"
          :is-active="convo.id === activeConversationId"
          @click="selectConversation(convo.id)"
        />
      </div>
    </div>

    <!-- 右侧聊天窗口 -->
    <div class="chat-window-panel">
      <template v-if="activeConversationId">
        <div class="panel-header">
          <!-- 显示对方的用户名 -->
          <h3>{{ activeParticipant?.username || '...' }}</h3>
        </div>
        <!-- 消息显示区域 -->
        <div class="messages-container" ref="messagesContainerRef">
           <MessageBubble
            v-for="message in activeConversationMessages"
            :key="message.id"
            :message="message"
            :is-self="message.fromUser.id === selfUserId" 
          />
        </div>
        <!-- 消息输入区域 -->
        <form class="message-input-form" @submit.prevent="handleSendMessage">
          <input
            v-model="newMessageContent"
            type="text"
            placeholder="输入消息..."
            :disabled="!activeConversationId"
          />
          <button type="submit" :disabled="!newMessageContent.trim()">发送</button>
        </form>
      </template>
      <div v-else class="placeholder-chat">
        <p>选择一个对话开始聊天</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessageStore } from '@/store/messages'; // 确保你的 store 路径正确
// 假设你有一个用户 store 来获取当前登录用户ID
import { useUserStore } from '@/store/user'; 


// 导入子组件
import ConversationListItem from '@/components/ConversationListItem.vue';
import MessageBubble from '@/components/MessageBubble.vue';

// --- 初始化 ---
const router = useRouter();
const route = useRoute();
const messagesStore = useMessageStore();
const userStore = useUserStore(); // 如果有用户store，取消注释

// --- 响应式状态 ---
const isLoading = ref(true);
const newMessageContent = ref('');
const messagesContainerRef = ref(null); // 用于控制滚动条

// --- 计算属性 ---

// 从 store 获取对话列表
const conversations = computed(() => messagesStore.conversations);

// 从 store 获取当前激活对话的消息列表
const activeConversationMessages = computed(() => messagesStore.activeConversationMessages);

// 从路由参数获取当前激活的对话ID
const activeConversationId = computed(() => route.params.conversationId ? parseInt(route.params.conversationId, 10) : null);

// 获取当前登录用户的ID (这里用一个假数据，你应该从你的用户store中获取)
const selfUserId = computed(() => userStore.userId);

// 获取当前聊天对象的信息
const activeParticipant = computed(() => {
  if (!activeConversationId.value) return null;
  const currentConvo = conversations.value.find(c => c.id === activeConversationId.value);
  return currentConvo ? currentConvo.participant : null;
});

// --- 方法 ---

// 1. 选择一个对话
function selectConversation(id) {
  // 使用 router.push 更新 URL，这将触发 watch 逻辑
  router.push(`/dashboard/messages/${id}`);
}

// 2. 发送新消息
async function handleSendMessage() {
  const content = newMessageContent.value.trim();
  // 确保有内容，并且当前对话和其关联物品信息都存在
  if (!content || !activeConversationObject.value?.item?.id) return;

  try {
    // 调用 store action，并传递完整的参数
    await messagesStore.sendNewMessage({
      toUserId: activeParticipant.value.id,
      itemId: activeConversationObject.value.item.id, // <--- 新增了这行
      content: content,
      // 如果你的API需要，也可以在这里添加 type: 'text'
    });
    newMessageContent.value = ''; // 清空输入框
  } catch (error) {
    console.error("发送消息失败:", error);
    // 这里可以添加UI提示
  }
}

// 3. 滚动到消息列表底部
function scrollToBottom() {
  nextTick(() => {
    const container = messagesContainerRef.value;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
}

// --- Watchers & Lifecycle Hooks ---

// 监听路由参数变化，当用户点击不同对话时
watch(
  activeConversationId,
  async (newId) => {
    if (newId) {
      // 调用 store 的 action 来获取该对话的详细消息
      await messagesStore.fetchMessages(newId);
      scrollToBottom(); // 获取消息后滚动到底部
    } else {
      // 如果没有选中对话，清空消息列表
      messagesStore.clearActiveConversation();
    }
  },
  { immediate: true } // 立即执行一次，处理页面初次加载时URL就带ID的情况
);

// 监听消息列表的变化，当新消息进来时自动滚动
watch(
  () => activeConversationMessages.value,
  () => {
    scrollToBottom();
  },
  { deep: true } // 深度监听，确保数组内对象变化也能被捕获
);

// 组件挂载时，获取所有对话列表
onMounted(async () => {
  try {
    await messagesStore.fetchConversations();
  } catch (error) {
    console.error("获取对话列表失败:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.messages-page {
  display: flex;
  height: calc(100vh - 80px); /* 减去顶部导航栏的高度，根据你的布局调整 */
  background-color: #f4f5f7;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.unread-badge {
  background-color: #f56c6c;
  color: white;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 0.75rem;
  font-weight: bold;
}

/* 左侧面板 */
.conversation-list-panel {
  width: 320px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.list-container {
  flex-grow: 1;
  overflow-y: auto;
  background-color: #fff;
}

/* 右侧面板 */
.chat-window-panel {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.messages-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1rem;
}

.message-input-form {
  display: flex;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background-color: #fff;
}

.message-input-form input {
  flex-grow: 1;
  border: 1px solid #ccc;
  border-radius: 20px;
  padding: 0.75rem 1rem;
  margin-right: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.message-input-form input:focus {
  border-color: #409eff;
}

.message-input-form button {
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: #409eff;
  color: white;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.message-input-form button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.placeholder, .placeholder-chat {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
  text-align: center;
}
</style>