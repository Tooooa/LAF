import { defineStore } from 'pinia';
import { getConversations, getMessagesInConversation, sendMessage } from '@/api/messages';

export const useMessageStore = defineStore('messages', {
  // ================= STATE =================
  state: () => ({
    conversations: [],                // 对话列表
    activeConversationId: null,       // 当前激活的对话ID
    activeConversation: null,         // 【核心修改】当前激活的对话对象，直接存储
    activeConversationMessages: [],   // 当前对话的消息列表
    isLoading: false,                 // 通用的加载状态
    isSending: false,                 // 发送消息的特定状态
    error: null,                      // 错误信息
    currentUser: null,                // 当前登录用户
  }),

  // ================= ACTIONS =================
  actions: {
    /**
     * 设置当前登录用户
     */
    setCurrentUser(user) {
      this.currentUser = user;
    },

    /**
     * 获取所有对话列表
     */
    // 在 stores/messages.js 的 actions 对象中

async fetchConversations() {
  this.isLoading = true;
  this.error = null; // 每次请求前清空旧错误

  try {
    const response = await getConversations();

    // 关键的防御性检查：
    // 确保 response 存在，并且它包含一个名为 'conversations' 的数组
    if (response && Array.isArray(response.conversations)) {
      
      // 正确地从响应中提取数组并赋值给 state
      this.conversations = response.conversations;

      // (可选) 如果你需要计算未读消息数
      this.unreadCount = this.conversations.reduce((sum, conv) => {
        // 确保 unreadCount 存在且是数字
        return sum + (Number(conv.unreadCount) || 0);
      }, 0);

      console.log('成功获取并更新了对话列表:', this.conversations);

    } else {
      // 如果后端返回的数据格式不符合预期，打印警告并设置为空数组
      console.warn('从API获取的对话数据格式不正确，或conversations字段不存在/不是数组。收到的数据:', response);
      this.conversations = [];
      this.unreadCount = 0;
    }
  } catch (err) {
    console.error('获取对话列表时发生错误:', err);
    this.error = err.message;
    this.conversations = []; // 出错时也应清空，防止页面显示旧数据
    this.unreadCount = 0;
  } finally {
    this.isLoading = false;
  }
},

    /**
     * 【核心修改】设置当前激活的对话ID，并尝试从现有列表中找到对话对象
     */
    setActiveConversationId(conversationId) {
      this.activeConversationId = conversationId;
      console.log('[id]: ', conversationId);
      if (conversationId) {
        this.activeConversation = this.conversations.find(c => c.id === conversationId) || null;
      } else {
        this.activeConversation = null;
      }
    },

    /**
     * 【核心修改】获取特定对话的消息，并确保对话对象已加载
     */
    async fetchMessages(conversationId) {
      if (!conversationId) return;
      
      this.isLoading = true;
      this.error = null;

      // 步骤1: 尝试从已有的对话列表中找到对话对象
      let conversation = this.conversations.find(c => c.id === conversationId);

      // 步骤2: 如果找不到 (通常是刷新页面导致 state.conversations 为空)
      if (!conversation) {
        await this.fetchConversations(); // 先获取完整的对话列表
        conversation = this.conversations.find(c => c.id === conversationId);
      }

      // 步骤3: 将找到的对话对象设置到 state 中
      this.activeConversation = conversation;

      // 步骤4: 如果最终还是找不到，说明 conversationId 无效，停止后续操作
      if (!this.activeConversation) {
        this.isLoading = false;
        this.error = `无法找到 ID 为 ${conversationId} 的对话。`;
        console.error(this.error);
        return; // 提前退出
      }

      // 步骤5: 获取该对话的消息列表
      try {
        const response = await getMessagesInConversation(conversationId);
        if (response.data.success) {
          this.activeConversationMessages = response.data.data.messages;
        } else {
          throw new Error(response.data.message || '获取消息失败');
        }
      } catch (err) {
        this.error = err.message;
        this.activeConversationMessages = []; // 出错时清空
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 发送新消息
     */
    async sendNewMessage(messageData) {
      this.isSending = true;
      this.error = null;
      try {
        const response = await sendMessage(messageData);
        if (response && response.success) {
          // 发送成功后，将新消息添加到当前消息列表，体验更好
          this.activeConversationMessages.push(response.data);
          
          // 同时，更新左侧对话列表的最后一条消息等信息
          await this.fetchConversations();
          
          return response;
        } else {
          throw new Error(response.message || '发送消息失败');
        }
      } catch (err) {
        this.error = err.message;
        return null;
      } finally {
        this.isSending = false;
      }
    },

    /**
     * 清空当前激活的对话状态
     */
    clearActiveConversation() {
      this.activeConversationId = null;
      this.activeConversation = null; // 也要清空这个对象
      this.activeConversationMessages = [];
    }
  },
});