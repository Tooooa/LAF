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
      
      <Pagination 
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        @page-change="handlePageChange"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import ItemCard from '@/components/ItemCard.vue';
import Pagination from '@/components/Pagination.vue';
import FilterBar from '@/components/FilterBar.vue';
import { getItems } from '@/api/items.js';

const items = ref([]);
const loading = ref(true);
const error = ref(null);

const pagination = reactive({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  pageSize: 12,
});

// 2. 创建一个 ref 来存储当前的筛选条件
const currentFilters = ref({});

// 获取物品列表数据的核心函数
async function fetchItems() {
  loading.value = true;
  error.value = null;
  try {
    const params = {
      page: pagination.currentPage,
      limit: pagination.pageSize,
      ...currentFilters.value
    };
    
    // 清理空参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    console.log('[DE]: params: ', params);

    const response = await getItems(params);

    console.log(response);
    
    // todo: 检测空数据
    if (!response || response.length === 0) {
      console.log('[WARNING] 后台数据库没有搜索到数据，为空');
      items.value = [];
      pagination.totalItems = response.pagination?.totalItems || 0;
      pagination.totalPages = response.pagination?.totalPages || 0;
      return;
    }
    
    items.value = response; 
    
    pagination.totalItems = response.pagination?.totalItems || 0;
    pagination.totalPages = response.pagination?.totalPages || 
                          Math.ceil(pagination.totalItems / pagination.pageSize) || 1;
  } catch (err) {
    console.error('获取物品列表失败:', err);
    error.value = err.message || '未知错误';
  } finally {
    loading.value = false;
  }
}

// 4. 新增的事件处理函数，用于处理来自 FilterBar 的事件
function handleFilterChange(newFilters) {
  // 更新当前筛选条件
  currentFilters.value = newFilters;
  // **重要**：当应用新的筛选时，应该将页码重置为 1
  pagination.currentPage = 1;
  // 使用新的筛选条件重新获取数据
  fetchItems();
}

function handlePageChange(newPage) {
  pagination.currentPage = newPage;
  fetchItems();
}

onMounted(() => {
  fetchItems();
});
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