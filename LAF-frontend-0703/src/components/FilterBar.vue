<template>
  <div class="filter-bar">
    <div class="filter-group">
      <!-- 使用 v-model 绑定输入值 -->
      <input 
        v-model="filters.keyword" 
        type="text" 
        placeholder="输入关键词搜索..." 
        class="filter-input"
        @keyup.enter="applyFilters" 
      />
    </div>
    <div class="filter-group">
      <!-- 使用 v-model 绑定选择的值 -->
      <select v-model="filters.category" class="filter-select">
        <option value="">所有分类</option>
        <option value="electronics">电子产品</option>
        <option value="documents">证件</option>
        <option value="books">书籍</option>
        <option value="others">其他</option>
      </select>
    </div>
    <div class="filter-group">
      <select v-model="filters.status" class="filter-select">
        <option value="">所有状态</option>
        <option value="active">进行中</option>
        <option value="resolved">已解决</option>
      </select>
    </div>
    <div class="filter-group">
      <!-- 点击按钮时调用 applyFilters 方法 -->
      <button @click="applyFilters" class="filter-button">筛选</button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

// 1. 使用 reactive 创建一个响应式对象来存储所有筛选条件
const filters = reactive({
  keyword: '',
  category: '',
  status: '',
});

// 2. 定义 emit 事件，'apply-filters' 是我们自定义的事件名
const emit = defineEmits(['apply-filters']);

// 3. 定义一个方法，当用户点击按钮或按回车时调用
function applyFilters() {
  // 通过 emit 将当前的 filters 对象发送给父组件
  // 我们发送一个 filters 的副本，以避免父组件直接修改子组件的状态
  emit('apply-filters', { ...filters });
}
</script>

<style scoped>
/* 样式保持不变 */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.filter-group {
  display: flex;
  align-items: center;
}

.filter-input, .filter-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.filter-button {
  padding: 0.5rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.filter-button:hover {
  background-color: #0056b3;
}
</style>