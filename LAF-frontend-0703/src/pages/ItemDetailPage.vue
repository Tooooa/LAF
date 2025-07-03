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
          <!-- 操作按钮 (目前仅为占位符) -->
          <button class="action-button primary">联系TA (发私信)</button>
          <!-- 编辑按钮：使用 router-link 进行导航 -->
          <router-link 
            v-if="isOwner" 
            :to="{ name: 'EditItem', params: { id: item.id } }" 
            class="action-button"
          >
            编辑
          </router-link>

          <!-- 标记按钮：添加 click 事件，并确保只有 active 状态才显示 -->
          <button 
            v-if="isOwner && item.status === 'active'" 
            @click="markAsResolved" 
            class="action-button danger"
          >
            标记为已找回
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router'; // 引入 useRoute 来访问路由信息
import { getItemById } from '@/api/items.js';
import StatusBadge from '@/components/StatusBadge.vue'; // 复用状态徽章组件
import defaultImage from '@/assets/default-image.png'; // 引入默认图片
import { useUserStore } from '@/store/user';
import { updateItemStatus } from '@/api/items'; 

const route = useRoute(); // 获取当前路由对象
const router = useRouter();
const userStore = useUserStore();
const loading = ref(true);
const error = ref(null);
// -- 响应式状态 --
const item = ref(null);
const isLoading = ref(true); // 用于显示加载状态
// 从路由参数中获取 itemId
const itemId = route.params.itemId;

// -- Computed 属性 --
// 判断当前登录用户是否是物品发布者
const isOwner = computed(() => {
  // 必须确保 userStore.user 和 item.value 都已加载
  if (!userStore.user || !item.value?.user) {
    return false;
  }
  return userStore.user.id === item.value.user.id;
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
      note: '用户自行标记为已解决' // 可选备注
    });

    if (res.success) {
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

// 获取物品详情的函数
async function fetchItemDetail() {
  loading.value = true;
  error.value = null;
  try {
    const response = await getItemById(itemId);
    
    // 修改点1：正确处理数组响应
    if (response.data && response.data.length > 0) {
      item.value = response.data[0]; // 取第一个物品
      
      // 修改点2：确保图片数据存在
      if (item.value.images && item.value.images.length > 0) {
        mainImage.value = item.value.images[0];
      }
    } else {
      error.value = '未找到该物品';
    }
    
  } catch (err) {
    console.error(`获取ID为 ${itemId} 的物品失败:`, err);
    error.value = err.response?.data?.message || err.message || '无法连接到服务器';
  } finally {
    loading.value = false;
  }
}

// -- 生命周期钩子 --
onMounted(async () => {
  const itemId = route.params.id;
  try {
    const res = await getItemById(itemId);
    if (res.success) {
      item.value = res.data;
    } else {
      // 处理获取失败的情况，比如跳转到404页面
      alert('无法加载物品信息，可能已被删除。');
      router.push('/');
    }
  } catch (error) {
    console.error('Fetch item detail error:', error);
    alert('网络错误，请稍后重试。');
  } finally {
    isLoading.value = false;
  }
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
</style>