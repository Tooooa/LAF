<template>
  <div class="page-container">
    <!-- 返回按钮 -->
    <div class="back-link-wrapper">
      <router-link to="/items" class="back-link">返回列表</router-link>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="status-info">正在加载物品详情...</div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="status-info error">
      加载失败：{{ error }}. <button @click="fetchItemDetail">重试</button>
    </div>

    <!-- 物品详情内容 -->
    <div v-else-if="item" class="item-detail-container">
      <!-- 左侧图片画廊 -->
      <div class="image-gallery">
        <!-- 修改点3：正确处理图片显示 -->
        <img 
          v-if="mainImage" 
          :src="mainImage" 
          @error="onImageError" 
          alt="物品图片" 
          class="main-image"
        >
        <div v-else class="no-image-placeholder">暂无图片</div>
      </div>

      <!-- 右侧信息区域 -->
      <div class="item-info">
        <header class="info-header">
          <h1 class="item-title">{{ item.title }}</h1>
          <StatusBadge :status="item.status" />
        </header>
        
        <div class="info-body">
          <p><strong>描述：</strong>{{ item.description || '暂无描述' }}</p>
          <p><strong>分类：</strong>{{ item.category?.name || '未分类' }}</p>
          <!-- 修改点4：使用正确的属性名 -->
          <p><strong>{{ item.type === 'lost' ? '丢失' : '捡到' }}地点：</strong>
            {{ item.location }} {{ item.locationDetail ? `(${item.locationDetail})` : '' }}
          </p>
          <!-- 修改点5：使用 lostDate 而不是 date -->
          <p><strong>{{ item.type === 'lost' ? '丢失' : '捡到' }}日期：</strong>
            {{ new Date(item.lostDate).toLocaleDateString() }}
          </p>
          <p><strong>联系方式：</strong>{{ item.contactInfo || '发布者未提供' }}</p>
          <!-- 修改点6：使用 author 而不是 user -->
          <p><strong>发布者：</strong>{{ item.author?.username || '匿名用户' }}</p>
          <p><strong>发布时间：</strong>{{ new Date(item.createdAt).toLocaleString() }}</p>
        </div>
        <footer class="info-footer">
          <!-- 
            *** 新增：标记为已找回按钮 ***
            - v-if="isOwner && item.status === 'active'": 
              确保只有所有者，并且在物品是活动状态时，才显示此按钮。
            - @click="markAsResolved": 点击时调用你已经写好的函数。
          -->
          <button 
            v-if="isOwner && item.status === 'active'" 
            @click="markAsResolved" 
            class="action-button success"
          >
            标记为已找回
          </button>
          <!-- 
            删除按钮 
            - v-if="isOwner": 确保只有物品的发布者才能看到此按钮。
            - @click="handleDeleteItem": 点击时调用我们的删除方法。
          -->
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
import { useRoute, useRouter } from 'vue-router'; // 引入 useRoute 来访问路由信息
import { getItemById } from '@/api/items.js';
import StatusBadge from '@/components/StatusBadge.vue'; // 复用状态徽章组件
import defaultImage from '@/assets/default-image.png'; // 引入默认图片
import { useUserStore } from '@/store/user';
import { updateItemStatus } from '@/api/items'; 
import { deleteItem } from '@/api/items.js';

const route = useRoute(); // 获取当前路由对象
const router = useRouter();
const userStore = useUserStore();
const loading = ref(true);
const error = ref(null);
// -- 响应式状态 --
const item = ref(null);
const isLoading = ref(true); // 用于显示加载状态
// 从路由参数中获取 itemId
const itemId = route.params.id;

// -- Computed 属性 --
// 判断当前登录用户是否是物品发布者
const isOwner = computed(() => {
  // 1. 确保当前登录用户信息存在
  if (!userStore.user || !userStore.user.id) {
    console.log('[DEBUG] isOwner: 当前登录用户信息不存在。');
    return false;
  }
  
  // 2. 确保物品信息和其作者信息存在
  if (!item.value || !item.value.author || !item.value.author.id) {
    console.log('[DEBUG] isOwner: 物品信息或作者信息不存在。');
    return false;
  }
  
  // 3. 打印出正在比较的两个ID，这是调试的关键步骤
  console.log(`[DEBUG] isOwner: 正在比较... 当前用户ID: ${userStore.user.id} (类型: ${typeof userStore.user.id}), 物品作者ID: ${item.value.author.id} (类型: ${typeof item.value.author.id})`);

  // 4. 进行比较
  // 使用 String() 来比较可以避免因类型不同（如 number vs string）导致的问题
  return String(userStore.user.id) === String(item.value.author.id);
});

// 计算主图URL
const mainImage = computed(() => {
  // 假设后端返回的 item 对象中有一个 imageUrls 数组
  if (item.value && item.value.imageUrls && item.value.imageUrls.length > 0) {
    return item.value.imageUrls[0];
  }
  return defaultImage;
});

// 图片加载失败处理
const onImageError = (event) => {
  event.target.src = defaultImage;
};

// 标记为已解决（已找回）
const markAsResolved = async () => {
  if (!confirm('确定要将此物品标记为“已解决”吗？此操作不可撤销。')) {
    return;
  }

  try {
    const res = await updateItemStatus(item.value.id, {
      status: 'resolved',
      authorId: userStore.user.id,
      note: '用户自行标记为已解决' // 可选备注
    });

    console.log('[DEBUG]: ', res);

    if (res.code == 200) {
      alert('状态更新成功！');
      // 直接在前端更新状态，页面会立即响应
      item.value.status = 'resolved'; 
    } else {
      alert(`操作失败: ${res.message}`);
    }
  } catch (error) {
    console.error("Failed to update item status:", error);
    alert('网络错误，操作失败。');
  }
};

async function handleDeleteItem() {
  // 最佳实践：在执行危险操作前，先向用户确认
  if (!window.confirm('您确定要删除此条信息吗？此操作不可撤销。')) {
    return; // 如果用户点击“取消”，则函数提前结束
  }

  // 检查 item.value 和 item.value.id 是否存在，避免错误
  if (!item.value || !item.value.id) {
    alert('错误：无法获取物品ID，无法删除。');
    return;
  }

  try {
    console.log(`[DEBUG] 准备删除ID为 ${item.value.id} 的物品...`);
    
    // 3. 调用 API 函数，传入物品ID
    const response = await deleteItem(item.value.id, userStore.user.id);

    // 4. 处理后端返回的响应
    // 假设你的 request 封装在成功时会直接返回 data 部分
    // 并且后端成功时返回 { success: true, message: '删除成功' }

    console.log('[DEBUG]: ', response);
    if (response && response.code == 200) {
      alert('信息删除成功！'); // 给用户成功的反馈

      // 删除成功后，跳转到物品列表页
      router.push({ name: 'ItemsList' }); // 假设你的列表页路由名叫 'ItemsList'
      
    } else {
      // 如果后端返回了 success: false 的情况
      throw new Error(response.message || '删除失败，但未收到明确错误信息。');
    }

  } catch (error) {
    console.error('删除物品时发生错误:', error);
    
    // 向用户显示一个友好的错误提示
    // 尝试从axios错误中获取后端返回的错误消息
    const errorMessage = error.response?.data?.message || error.message || '网络错误，删除失败，请稍后重试。';
    alert(`错误: ${errorMessage}`);
  }
}

// 获取物品详情的函数
async function fetchItemDetail() {
  loading.value = true;
  error.value = null;
  try {
    const res = await getItemById(itemId);
    console.log('[DEBUG]: id search, result: ', res);
    if (Array.isArray(res) && res.length > 0) {
      item.value = res[0];
    } else {
      error.value = '未找到该物品';
      router.push('/items');
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
  background-color: #dcfce7; /* 淡绿色背景 */
  border-color: #bbf7d0;
  color: #166534; /* 深绿色文字 */
}
.action-button.success:hover {
  background-color: #d0f7de;
}
</style>