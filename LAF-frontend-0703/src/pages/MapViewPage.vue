<!-- src/pages/MapViewPage.vue -->
<template>
  <div class="map-view-page">
    <!-- Filter Controls -->
    <div class="filter-bar">
      <!-- ... (筛选器代码不变) ... -->
      <select v-model="filters.type">
        <option value="all">所有类型</option>
        <option value="lost">失物</option>
        <option value="found">拾物</option>
      </select>
      <select v-model="filters.timeRange">
        <option value="all">所有时间</option>
        <option value="7d">最近7天</option>
        <option value="30d">最近30天</option>
      </select>
    </div>

    <!-- Content Container -->
    <div class="content-container">
      <div class="map-container-wrapper">
        <p v-if="loading && !items.length" class="loading-text">正在加载地图数据...</p>
        
        <!-- ================== 关键点 1 ================== -->
        <!-- 确保这里有 @map-bounds-changed 来监听子组件的事件 -->
        <MapContainer 
          :items="items" 
          @map-bounds-changed="handleMapBoundsChange" 
        />
        <!-- ============================================== -->
        
      </div>
      
      <div class="stats-panel">
        <!-- ... (统计面板代码不变) ... -->
        <h3>地图统计 ({{ filters.timeRange === 'all' ? '所有时间' : `最近${filters.timeRange.slice(0, -1)}天` }} 内)</h3>
        <div v-if="loading" class="loading-stats">
          <p>加载中...</p>
        </div>
        <ul v-else class="stats-list">
          <li>总物品数: {{ stats.totalItems }}</li>
          <li>失物数量: {{ stats.lostItems }}</li>
          <li>拾物数量: {{ stats.foundItems }}</li>
          <li>热力点数: {{ stats.heatmapPoints }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import MapContainer from '@/components/MapContainer.vue';

const loading = ref(true);
const items = ref([]);
const stats = ref({ totalItems: 0, lostItems: 0, foundItems: 0, heatmapPoints: 0 });

// ================== 关键点 2 ==================
// mapBounds 的初始值必须是 null，等待子组件的初始化
const mapBounds = ref(null);
// ==============================================

const filters = reactive({
  type: 'all',
  timeRange: '30d'
});

const fetchMapData = async () => {
  // ================== 关键点 3 ==================
  // 这个判断是请求无法发出的直接原因。我们必须确保 mapBounds 能被正确赋值。
  if (!mapBounds.value) {
    console.log("等待地图初始化并提供边界信息...");
    return;
  }
  // ==============================================

  loading.value = true;
  try {
    const boundsString = `${mapBounds.value.minLng},${mapBounds.value.minLat},${mapBounds.value.maxLng},${mapBounds.value.maxLat}`;
    const apiUrl = `http://localhost:4000/v1/map/items?type=${filters.type}&timeRange=${filters.timeRange}&bounds=${boundsString}`;

    // 添加一个 console.log 来确认请求即将发出
    console.log('即将发送API请求:', apiUrl);
    
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    if (result.success && result.data) {
      items.value = result.data.items;
      stats.value = result.data.stats;
    } else {
      console.error('API调用失败:', result.message);
    }
  } catch (error) {
    console.error('获取地图数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// ================== 关键点 4 ==================
// 这个函数是连接父子组件的桥梁。它必须被正确调用。
const handleMapBoundsChange = (newBounds) => {
  // 添加 console.log 确认事件已被接收
  console.log('MapViewPage: 已接收到来自MapContainer的bounds:', newBounds);
  
  mapBounds.value = newBounds;
  fetchMapData(); // 在获取到边界后立即获取数据
};
// ==============================================

watch(filters, () => {
  // 当筛选器改变时，如果已有地图边界，则重新获取数据
  if (mapBounds.value) {
    fetchMapData();
  }
}, { deep: true });

// 注意：这里不再需要 onMounted 来调用 fetchMapData，
// 因为初始的数据获取将由 MapContainer 的 'map-bounds-changed' 事件触发。
</script>

<style scoped>
/* ... (样式代码不变) ... */
.map-view-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px); /* 假设你的导航栏是60px高 */
}
.filter-bar {
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
}
.filter-bar select {
  margin-right: 10px;
  padding: 5px;
}
.content-container {
  display: flex;
  flex: 1;
  overflow: hidden; /* 防止页面出现不必要的滚动条 */
}
.map-container-wrapper {
  flex: 3;
  position: relative;
}
.stats-panel {
  flex: 1;
  padding: 20px;
  border-left: 1px solid #ddd;
  background-color: #fafafa;
  overflow-y: auto; /* 如果统计信息多，可以滚动 */
}
.loading-text, .loading-stats {
  text-align: center;
  color: #888;
  padding: 20px;
}
.stats-list {
  list-style: none;
  padding: 0;
}
.stats-list li {
  margin-bottom: 10px;
}
</style>