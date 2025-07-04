<template>
  <div class="location-input-container">
    <!-- 输入框 -->
    <input
      type="text"
      v-model="userInput"
      placeholder="输入地点名称、拼音或首字母"
      class="search-input"
    />

    <!-- 状态显示区域 -->
    <div class="status-and-results">
      <!-- 初始加载状态 -->
      <div v-if="isInitializing" class="status-message">
        * 正在初始化地点数据...
      </div>

      <!-- 搜索结果列表 -->
      <ul v-else-if="suggestions.length > 0" class="suggestions-list">
        <li
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          class="suggestion-item"
        >
          {{ suggestion.fullName }}
        </li>
      </ul>

      <!-- 无结果提示 -->
      <div
        v-else-if="userInput && !isInitializing"
        class="status-message"
      >
        * 未找到匹配的地点
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { pinyin } from 'pinyin-pro'; // 1. 引入 pinyin-pro

// --- 响应式状态定义 ---

// 用于存储从后端获取并处理后的所有地点数据
const allLocationsWithPinyin = ref([]);

// 绑定到输入框的用户输入
const userInput = ref('');

// 存储过滤后的搜索建议列表，用于渲染
const suggestions = ref([]);

// 标记组件是否正在进行首次数据加载和处理
const isInitializing = ref(false);

// 模拟的 API 请求函数 (请替换为您自己的 API 请求)
const fetchAllLocations = async () => {
  // 注意：这里假设您的 API 在不带 query 参数时返回所有地点
  const response = await fetch('http://localhost:4000/v1/locations/suggestions');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data.data.suggestions;
};


// --- 生命周期钩子 ---

// 2. 组件挂载后，执行一次数据获取和预处理
onMounted(async () => {
  isInitializing.value = true;
  try {
    const locations = await fetchAllLocations();

    // 3. 对每个地点数据进行处理，添加拼音和首字母字段
    allLocationsWithPinyin.value = locations.map(location => {
      const name = location.name || '';
      return {
        ...location,
        // 生成全拼，无声调，并去除空格 (例如 "图书馆" -> "tushuguan")
        pinyin: pinyin(name, { toneType: 'none' }).replace(/\s/g, ''),
        // 生成首字母 (例如 "图书馆" -> "tsg")
        pinyinInitials: pinyin(name, { pattern: 'first', toneType: 'none' }).replace(/\s/g, ''),
      };
    });

  } catch (error) {
    console.error("初始化地点数据失败:", error);
    // 可以在这里添加用户提示，例如弹出一个错误消息
  } finally {
    isInitializing.value = false;
  }
});


// --- 监听器 ---

// 4. 监听用户输入的变化，并在本地进行搜索
watch(userInput, (newQuery) => {
  if (isInitializing.value) {
    // 如果还在初始化，则不进行搜索
    suggestions.value = [];
    return;
  }

  if (!newQuery) {
    // 如果输入框为空，清空建议列表
    suggestions.value = [];
    return;
  }

  const lowerCaseQuery = newQuery.toLowerCase();

  // 5. 在预处理过的数据中进行过滤
  suggestions.value = allLocationsWithPinyin.value.filter(location =>
    // 匹配项1: 中文名称包含输入内容 (例如 输入 "三" 匹配 "教三楼")
    location.name.includes(lowerCaseQuery) ||
    // 匹配项2: 全拼以输入内容开头 (例如 输入 "jiao" 匹配 "教三楼")
    location.pinyin.startsWith(lowerCaseQuery) ||
    // 匹配项3: 首字母以输入内容开头 (例如 输入 "jsl" 匹配 "教三楼")
    location.pinyinInitials.startsWith(lowerCaseQuery)
  );
});
</script>

<style scoped>
/* 添加一些简单的样式，让它看起来更清晰 */
.location-input-container {
  max-width: 400px;
  margin: 20px auto;
  font-family: sans-serif;
}

.search-input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.status-and-results {
  margin-top: 5px;
  border: 1px solid #eee;
  border-radius: 4px;
  min-height: 40px;
  padding: 10px;
}

.status-message {
  color: #888;
}

.suggestions-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.suggestion-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background-color: #f5f5f5;
}
</style>