import { defineStore } from 'pinia';
import { getConversations, getMessagesInConversation, sendMessage } from '@/api/messages';

export const useMessageStore = defineStore('messages', {
  // State: 定义状态
  state: () => ({
    conversations: [], // 对话列表
    activeConversationId: null, // 当前激活的对话ID
    activeConversationMessages: [], // 当前对话的消息列表
    unreadCount: 0, // 总未读消息数
    isLoading: false,
    error: null,
  }),

  // Getters: 计算属性
  getters: {
    // 获取当前激活的对话
    activeConversation: (state) => {
      return state.conversations.find(c => c.id === state.activeConversationId);
    }
  },

  // Actions: 定义方法
  actions: {
    // 获取对话列表
    async fetchConversations() {
      this.isLoading = true;
      try {
        const response = await getConversations();
        if (response.data.success) {
          this.conversations = response.data.data.conversations;
          // 从对话列表中计算总未读数
          this.unreadCount = this.conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
        } else {
          throw new Error(response.data.message);
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.isLoading = false;
      }
    },

    // 获取特定对话的消息
    async fetchMessages(conversationId) {
      if (!conversationId) return;
      this.isLoading = true;
      this.activeConversationId = conversationId;
      try {
        const response = await getMessagesInConversation(conversationId);
        if (response.data.success) {
          this.activeConversationMessages = response.data.data.messages;
        } else {
          throw new Error(response.data.message);
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.isLoading = false;
      }
    },

    // 发送新消息
    async sendNewMessage(messageData) {
      // messageData 应该包含 { toUserId, itemId, content }
      try {
        const response = await sendMessage(messageData);
        if (response.data.success) {
          // 发送成功后，理想情况下是实时更新，但简单的做法是重新拉取当前对话的消息
          if (this.activeConversationId) {
            await this.fetchMessages(this.activeConversationId);
          }
          // 如果是新对话，则需要刷新对话列表
          await this.fetchConversations();
          return response.data.data; // 返回成功后的消息体
        } else {
          throw new Error(response.data.message);
        }
      } catch (err) {
        this.error = err.message;
        return null;
      }
    },

    // 清空当前对话
    clearActiveConversation() {
        this.activeConversationId = null;
        this.activeConversationMessages = [];
    }
  },
});