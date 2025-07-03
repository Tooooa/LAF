<template>
  <div class="pagination-container" v-if="totalPages > 1">
    <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">
       上一页
    </button>
    
    <button 
      v-for="page in pages" 
      :key="page"
      :class="{ active: currentPage === page }"
      @click="changePage(page)"
    >
      {{ page }}
    </button>

    <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">
      下一页 
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  // 可选：你还可以添加 totalItems 和 pageSize props
});

// 定义一个 emit 事件，用于通知父组件页码已改变
const emit = defineEmits(['page-change']);

// 计算要显示的页码（这里做了简化，只显示所有页码，实际项目可以做得更复杂）
const pages = computed(() => {
  const pageArray = [];
  for (let i = 1; i <= props.totalPages; i++) {
    pageArray.push(i);
  }
  return pageArray;
});

// 点击页码时触发的函数
function changePage(page) {
  if (page < 1 || page > props.totalPages || page === props.currentPage) {
    return;
  }
  emit('page-change', page);
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 0.5rem;
}

button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background-color: #fff;
  cursor: pointer;
  border-radius: 4px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

button.active {
  background-color: #007bff;
  color: #fff;
  border-color: #007bff;
  font-weight: bold;
}
</style>