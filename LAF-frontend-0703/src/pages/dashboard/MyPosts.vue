<!-- src/pages/dashboard/MyPosts.vue -->
<template>
  <div class="posts-container">
    <h2 class="title">我发布的物品</h2>

    <!-- 加载状态 -->
    <div v-if="loading" class="state-info loading">
      <p>正在努力加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="state-info error">
      <p>{{ error }}</p>
      <button @click="fetchUserItems()">重试</button>
    </div>

    <!-- 正常数据展示 -->
    <div v-else-if="items.length > 0">
      <div class="items-list">
        <!-- 复用你已有的 ItemCard 组件 -->
        <ItemCard 
          v-for="item in items" 
          :key="item.id" 
          :item-data="item"
        />
      </div>
      <!-- 复用你已有的 Pagination 组件 -->
      <Pagination
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        @page-change="handlePageChange"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="state-info empty-state">
      <p>您还没有发布任何物品。</p>
      <router-link to="/publish" class="publish-link">去发布第一件物品</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
// 正确地从你的 api 文件中导入
import { getItems } from '@/api/items'; 
import { useUserStore } from '@/store/user';

// 引入子组件
import ItemCard from '@/components/ItemCard.vue';
import Pagination from '@/components/Pagination.vue';

const userStore = useUserStore();
const items = ref([]);
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
});
const loading = ref(true); // 初始为 true，进入页面立即加载
const error = ref(null);

// 从 store 获取用户 ID
const userId = computed(() => userStore.user?.id);

// 获取用户发布的物品列表
const fetchUserItems = async (page = 1) => {
  if (!userId.value) {
    error.value = "无法获取用户信息，请重新登录。";
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const params = {
      page: page,
      pageSize: pagination.pageSize, 
      authorId: userId.value,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    // 使用你封装好的 getItems 方法
    console.log('[DEBUG]: my params: ', params);
    const response = await getItems(params);
    console.log('[DEBUG]: my posts: ', response);
    items.value = response;
    pagination.totalItems = response.length || 0;
    pagination.totalPages = Math.ceil(pagination.totalItems / pagination.pageSize) || 1;
    console.log('成功获取用户发布的物品', response);
  } catch (err) {
    console.error("获取用户物品列表失败:", err);
    error.value = "获取物品列表失败，请检查网络或稍后再试。";
  } finally {
    loading.value = false;
  }
};

// 分页组件触发的事件处理
const handlePageChange = (newPage) => {
  fetchUserItems(newPage);
};

// 组件挂载时，执行第一次数据获取
onMounted(() => {
  fetchUserItems();
});
</script>

<style scoped>
.posts-container {
  padding: 1rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.items-list {
  display: grid;
  /* 响应式布局，每列最小250px */
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.state-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.state-info.error {
  color: #dc3545;
  background-color: #f8d7da;
}

.state-info button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.publish-link {
  margin-top: 1rem;
  padding: 0.6rem 1.2rem;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  transition: background-color 0.2s;
}

.publish-link:hover {
  background-color: #0056b3;
}
</style>