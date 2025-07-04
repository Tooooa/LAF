<template>
  <div class="page-container">
    <div class="back-link-wrapper">
      <router-link to="/items" class="back-link">返回列表</router-link>
    </div>

    <div v-if="loading" class="status-info">正在加载物品详情...</div>
    
    <div v-else-if="error" class="status-info error">
      加载失败：{{ error }}. <button @click="fetchItemDetail">重试</button>
    </div>

    <div v-else-if="item" class="item-detail-container">
      <div class="image-gallery">
        <img 
          v-if="mainImage" 
          :src="mainImage" 
          @error="onImageError" 
          alt="物品图片" 
          class="main-image"
        >
        <div v-else class="no-image-placeholder">暂无图片</div>
      </div>

      <div class="item-info">
        <header class="info-header">
          <h1 class="item-title">{{ item.title }}</h1>
          <StatusBadge :status="item.status" />
        </header>
        
        <div class="info-body">
          <p><strong>描述：</strong>{{ item.description || '暂无描述' }}</p>
          <p><strong>分类：</strong>{{ item.category?.name || '未分类' }}</p>
          <p><strong>{{ item.type === 'lost' ? '丢失' : '捡到' }}地点：</strong>
            {{ item.location }} {{ item.locationDetail ? `(${item.locationDetail})` : '' }}
          </p>
          <p><strong>{{ item.type === 'lost' ? '丢失' : '捡到' }}日期：</strong>
            {{ new Date(item.lostDate).toLocaleDateString() }}
          </p>
          <p><strong>联系方式：</strong>{{ item.contactInfo || '发布者未提供' }}</p>
          <p><strong>发布者：</strong>{{ item.author?.username || '匿名用户' }}</p>
          <p><strong>发布时间：</strong>{{ new Date(item.createdAt).toLocaleString() }}</p>
        </div>

        <footer class="info-footer">
          <button
            v-if="!isOwner"
            @click="startConversation"
            class="action-button primary"
          >
            发起私信
          </button>
          
          <button 
            v-if="isOwner && item.status === 'active'" 
            @click="markAsResolved" 
            class="action-button success"
          >
            标记为已找回
          </button>

          <button 
            v-if="isOwner" 
            @click="handleDeleteItem" 
            class="action-button danger"
          >
            删除信息
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getItemById } from '@/api/items.js';
import StatusBadge from '@/components/StatusBadge.vue';
import defaultImage from '@/assets/default-image.png';
import { useUserStore } from '@/store/user';
import { useMessageStore } from '@/store/messages'; // 【新增】引入 Message Store
import { updateItemStatus } from '@/api/items'; 
import { deleteItem } from '@/api/items.js';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const messageStore = useMessageStore(); // 【新增】初始化 Message Store
const loading = ref(true);
const error = ref(null);
const item = ref(null);
const itemId = route.params.id;

// -- Computed 属性 --
// 判断当前登录用户是否是物品发布者
const isOwner = computed(() => {
  if (!userStore.user || !userStore.user.id) {
    return false;
  }
  if (!item.value || !item.value.author || !item.value.author.id) {
    return false;
  }
  return String(userStore.user.id) === String(item.value.author.id);
});

// 计算主图URL
const mainImage = computed(() => {
  if (item.value && item.value.imageUrls && item.value.imageUrls.length > 0) {
    return item.value.imageUrls[0];
  }
  return defaultImage;
});

// -- 方法 --
// 图片加载失败处理
const onImageError = (event) => {
  event.target.src = defaultImage;
};

// 标记为已解决
const markAsResolved = async () => {
  if (!confirm('确定要将此物品标记为“已解决”吗？此操作不可撤销。')) {
    return;
  }
  try {
    const res = await updateItemStatus(item.value.id, {
      status: 'resolved',
      authorId: userStore.user.id,
      note: '用户自行标记为已解决'
    });
    if (res.code == 200) {
      alert('状态更新成功！');
      item.value.status = 'resolved'; 
    } else {
      alert(`操作失败: ${res.message}`);
    }
  } catch (error) {
    console.error("Failed to update item status:", error);
    alert('网络错误，操作失败。');
  }
};

// 删除物品
async function handleDeleteItem() {
  if (!window.confirm('您确定要删除此条信息吗？此操作不可撤销。')) {
    return;
  }
  if (!item.value || !item.value.id) {
    alert('错误：无法获取物品ID，无法删除。');
    return;
  }
  try {
    const response = await deleteItem(item.value.id, userStore.user.id);
    if (response && response.code == 200) {
      alert('信息删除成功！');
      router.push({ name: 'ItemsList' });
    } else {
      throw new Error(response.message || '删除失败，但未收到明确错误信息。');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || '网络错误，删除失败，请稍后重试。';
    alert(`错误: ${errorMessage}`);
  }
}

/**
 * 【新增】开始对话的函数
 */
const startConversation = async () => {
  // 确保物品和作者信息存在
  if (!item.value || !item.value.author || !item.value.author.id) {
    alert('无法获取发布者信息。');
    return;
  }
  // 确保当前用户已登录
  if (!userStore.user || !userStore.user.id) {
    alert('请先登录再发起对话。');
    // 可选：跳转到登录页
    // router.push('/login');
    return;
  }

  try {
    // 1. 先检查是否已存在这个对话
    await messageStore.fetchConversations(); // 确保对话列表是新的
    const existingConv = messageStore.conversations.find(c => 
      c.item.id === item.value.id && c.participant.id === item.value.author.id
    );

    if (existingConv) {
      // 2. 如果存在，直接跳转到该对话
      router.push(`/messages/${existingConv.id}`);
    } else {
      // 3. 如果不存在，发送一条初始消息来创建对话
      const messageData = {
        toUserId: item.value.author.id,
        itemId: item.value.id,
        content: `你好，我对你发布的 "${item.value.title}" 很感兴趣。`
      };
      
      const newConversation = await messageStore.sendNewMessage(messageData);
      
      if (newConversation) {
          // 再次获取最新对话列表以找到新创建的对话ID
          await messageStore.fetchConversations(); 
          const conv = messageStore.conversations.find(c => c.item.id === item.value.id && c.participant.id === item.value.author.id);
          if (conv) {
              router.push(`/messages/${conv.id}`);
          } else {
              // 如果因为某些原因找不到，跳转到消息列表页
              router.push('/messages');
          }
      } else {
          // 处理API返回失败的情况
          alert('无法发起对话，请稍后再试。');
      }
    }
  } catch (error) {
    console.error("发起对话时出错:", error);
    alert('操作失败，请检查网络或稍后重试。');
  }
};


// 获取物品详情的函数
async function fetchItemDetail() {
  loading.value = true;
  error.value = null;
  try {
    const res = await getItemById(itemId);
    if (Array.isArray(res) && res.length > 0) {
      item.value = res[0];
    } else {
      error.value = '未找到该物品';
      // 可选：短暂显示信息后跳转
      setTimeout(() => router.push('/items'), 2000);
    } 
  } catch (err) {
    console.error(`获取ID为 ${itemId} 的物品失败:`, err);
    error.value = err.response?.data?.message || err.message || '无法连接到服务器';
  } finally {
    loading.value = false;
  }
}

// -- 生命周期钩子 --
onMounted(() => {
  fetchItemDetail();
});
</script>

<style scoped>
.page-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.back-link-wrapper {
  margin-bottom: 1.5rem;
}

.back-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}
.back-link:hover {
  text-decoration: underline;
}

.status-info {
  text-align: center;
  padding: 3rem;
  color: #666;
}
.status-info.error {
  color: #dc3545;
}

.item-detail-container {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 2rem;
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.image-gallery .main-image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 8px;
  background-color: #f0f0f0;
}

.no-image-placeholder {
  width: 100%;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  color: #999;
  border-radius: 8px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.item-title {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.info-body p {
  line-height: 1.7;
  color: #333;
}

.info-body p strong {
  color: #000;
  margin-right: 0.5em;
}

.info-footer {
  margin-top: 2rem;
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap; /* 【修改】允许按钮换行 */
}

.action-button {
  padding: 0.6rem 1.2rem;
  border: 1px solid #ccc;
  background: #f8f8f8;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}
.action-button:hover {
  border-color: #aaa;
  background-color: #f1f1f1;
}

/* 【新增】主要按钮样式 */
.action-button.primary {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}
.action-button.primary:hover {
  background-color: #0056b3;
}

.action-button.danger {
    background-color: #dc3545;
    color: white;
    border-color: #dc3545;
}
.action-button.danger:hover {
    background-color: #c82333;
}

.action-button.success {
  background-color: #28a745; /*【修改】使用更鲜明的成功色 */
  color: white;
  border-color: #28a745;
}
.action-button.success:hover {
  background-color: #218838;
}

/* 响应式布局：在小屏幕上垂直排列 */
@media (max-width: 768px) {
  .item-detail-container {
    grid-template-columns: 1fr; /* 单列布局 */
  }
}
</style>