<template>
  <div class="location-input-container">
    <input
      type="text"
      :value="modelValue"
      @input="handleInput"
      @blur="hideSuggestions"
      placeholder="输入地点，如：图书馆三楼"
      class="form-input"
    />
    <ul v-if="showSuggestions && suggestions.length > 0" class="suggestions-list">
      <li v-if="isLoading">正在搜索...</li>
      <li 
        v-for="suggestion in suggestions" 
        :key="suggestion.id" 
        @mousedown="selectSuggestion(suggestion)"
      >
        {{ suggestion.fullName }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { fetchLocationSuggestions } from '@/api/locations';
import { debounce } from 'lodash-es'; // 引入 debounce

const props = defineProps({
  modelValue: String, // 使用 v-model
});
const emit = defineEmits(['update:modelValue']);

const suggestions = ref([]);
const showSuggestions = ref(false);
const isLoading = ref(false);

// 使用 debounce 防止 API 请求过于频繁
const debouncedFetch = debounce(async (query) => {
  if (query.length < 2) {
    suggestions.value = [];
    return;
  }
  isLoading.value = true;
  try {
    const res = await fetchLocationSuggestions(query);
    if (res.success) {
      suggestions.value = res.data.suggestions;
    }
  } catch (error) {
    console.error("Failed to fetch location suggestions:", error);
  } finally {
    isLoading.value = false;
  }
}, 300); // 300ms 延迟

const handleInput = (event) => {
  const query = event.target.value;
  emit('update:modelValue', query);
  showSuggestions.value = true;
  debouncedFetch(query);
};

const selectSuggestion = (suggestion) => {
  emit('update:modelValue', suggestion.fullName);
  suggestions.value = [];
  showSuggestions.value = false;
};

// 使用 setTimeout 确保在点击事件触发后再隐藏
const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};
</script>

<style scoped>
.location-input-container { position: relative; width: 100%; }
.form-input { width: 100%; padding: 8px; box-sizing: border-box; }
.suggestions-list {
  position: absolute; top: 100%; left: 0; right: 0;
  background: white; border: 1px solid #ccc;
  list-style: none; margin: 4px 0 0; padding: 0;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}
.suggestions-list li {
  padding: 8px 12px;
  cursor: pointer;
}
.suggestions-list li:hover {
  background-color: #f0f0f0;
}
</style>