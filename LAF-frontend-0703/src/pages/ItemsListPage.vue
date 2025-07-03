<template>
  <div class="page-container">
    <!-- <h1>物品广场</h1> -->
    
    <!-- 1. 监听 FilterBar 的 @apply-filters 事件 -->
    <FilterBar @apply-filters="handleFilterChange" />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">正在加载中...</div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">加载失败：{{ error }}</div>

    <!-- 成功获取数据后显示 -->
    <template v-else>
      <div v-if="items.length > 0" class="items-grid">
        <ItemCard 
          v-for="item in items" 
          :key="item.id" 
          :item-data="item"
        />
      </div>
      <div v-else class="empty-state">没有找到相关物品。</div>
      
      <!-- 分页导航栏
      <Pagination
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        @page-change="handlePageChange"
      /> -->
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // <-- 新增 useRouter
import ItemCard from '@/components/ItemCard.vue';
import Pagination from '@/components/Pagination.vue';
import FilterBar from '@/components/FilterBar.vue';
import { getItems } from '@/api/items.js';

// --- 状态定义 ---
const items = ref([]);
const loading = ref(true);
const error = ref(null);

const pagination = reactive({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  pageSize: 8,
});

const route = useRoute();
const router = useRouter(); // <-- 新增 router 实例，用于更新URL

// --- 统一的数据获取函数 ---
// 这个函数现在是唯一的入口点，它总是从 URL (route.query) 获取参数
async function fetchItems() {
  loading.value = true;
  error.value = null;
  
  try {
    // 直接从 route.query 构建请求参数，这是我们统一的数据源
    const params = {
      // 确保分页信息也从URL或默认值中获取
      page: route.query.page || 1, 
      limit: pagination.pageSize,
      ...route.query // 将URL中所有其他参数（keyword, category等）都包含进来
    };
    
    console.log('[DEBUG] 正在使用以下参数请求数据:', params);
    const response = await getItems(params);

    // --- 健壮的响应处理 ---
    // 假设后端返回标准格式: { success: true, data: [...], pagination: {...} }
    if (response && response) {
      items.value = response || [];
      // 更新分页信息
      const p = response.pagination;
      pagination.currentPage = p?.page || 1;
      pagination.totalItems = p?.totalItems || 0;
      pagination.totalPages = p?.totalPages || 1;
    } else {
      // 处理后端返回 {success: false} 或其他非预期格式
      throw new Error(response.message || '获取数据失败');
    }

  } catch (err) {
    console.error('获取物品列表失败:', err);
    error.value = err.message || '未知错误';
    // 发生错误时清空数据
    items.value = [];
    pagination.totalItems = 0;
    pagination.totalPages = 1;
  } finally {
    loading.value = false;
  }
}

// --- 事件处理函数 (现在只负责更新URL) ---

// 处理来自 FilterBar 的筛选事件
function handleFilterChange(newFilters) {
  console.log('[DEBUG] FilterBar 触发变更:', newFilters);
  // 合并现有URL参数和新筛选条件，并将页码重置为1
  const query = {
    ...route.query,
    ...newFilters,
    page: 1, // 应用新筛选时，必须返回第一页
  };

  // 使用 router.push 更新 URL。这将自动触发下面的 watch
  router.push({ query });
}

// 处理来自 Pagination 的分页事件
function handlePageChange(newPage) {
  console.log('[DEBUG] Pagination 触发变更，新页码:', newPage);
  // 合并现有URL参数和新页码
  const query = {
    ...route.query,
    page: newPage,
  };
  
  // 使用 router.push 更新 URL，同样会自动触发 watch
  router.push({ query });
}

// --- 核心监听器 (替换了所有旧的调用逻辑) ---
// 这个 watch 现在是驱动所有数据获取的“引擎”
watch(
  () => route.query,
  (newQuery, oldQuery) => {
    // 这里的 console 可以在调试时看到URL参数的变化
    console.log('[DEBUG] URL query 发生变化，准备重新获取数据:', newQuery);
    fetchItems();
  },
  {
    immediate: true, // <-- 关键！让 watch 在组件加载时立即执行一次
    deep: true // 深度监听，确保所有参数变化都能被捕获
  }
);
</script>

<style scoped>
/* 样式保持不变 */
.page-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 4rem 0;
  font-size: 1.2rem;
  color: #666;
}
</style>