<!-- src/pages/MapViewPage.vue -->
<template>
  <div class="map-view-page">
    <!-- 侧边栏：筛选和统计信息 -->
    <aside class="sidebar">
      <div class="filter-section">
        <h3>筛选</h3>
        <select v-model="filters.type" @change="fetchData">
          <option value="all">所有类型</option>
          <option value="lost">失物</option>
          <option value="found">拾物</option>
        </select>
        <select v-model="filters.timeRange" @change="fetchData">
          <option value="all">所有时间</option>
          <option value="7d">最近7天</option>
          <option value="30d">最近30天</option>
        </select>
      </div>

      <div class="stats-section">
        <h3>地图统计 ({{ stats.timeRange }} 内)</h3>
        <div v-if="statsLoading" class="loading">加载中...</div>
        <ul v-else>
          <li>总物品数: <strong>{{ stats.totalItems }}</strong></li>
          <li>已找回: <strong>{{ stats.resolvedItems }}</strong></li>
          <li>找回率: <strong>{{ stats.successRate }}%</strong></li>
          <li>平均找回耗时: <strong>{{ stats.avgResolveHours }} 小时</strong></li>
        </ul>
      </div>
    </aside>

    <!-- 地图区域 -->
    <main class="map-area">
      <div v-if="mapItemsLoading" class="map-loader">
        正在加载地图数据...
      </div>
      <MapContainer
        :items="mapItems"
        :heatmap-data="heatmapData"
        @map-bounds-changed="onBoundsChanged"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import MapContainer from '@/components/MapContainer.vue';
import { getMapItems, getMapStatistics } from '@/api/locations';

const filters = reactive({
  type: 'all',
  timeRange: '30d',
  bounds: '',
});

const mapItems = ref([]);
const heatmapData = ref([]);
const mapItemsLoading = ref(false);

const stats = ref({});
const statsLoading = ref(false);

// 当地图边界变化时触发
const onBoundsChanged = (boundsString) => {
  filters.bounds = boundsString;
  fetchData();
};

// 获取地图数据（标记点和热力图）
const fetchData = async () => {
  if (!filters.bounds) return; // 确保有地图边界才请求
  mapItemsLoading.value = true;
  try {
    const response = await getMapItems(filters);
    mapItems.value = response.data.items;
    heatmapData.value = response.data.heatmapData;
  } catch (error) {
    console.error("获取地图物品数据失败:", error);
  } finally {
    mapItemsLoading.value = false;
  }
};

// 获取统计数据
const fetchStats = async () => {
  statsLoading.value = true;
  try {
    const response = await getMapStatistics({ timeRange: filters.timeRange });
    stats.value = response.data;
  } catch (error) {
    console.error("获取地图统计数据失败:", error);
  } finally {
    statsLoading.value = false;
  }
};

onMounted(() => {
  fetchStats();
});
</script>

<style scoped>
.map-view-page {
  display: flex;
  height: calc(100vh - 60px); /* 减去导航栏高度 */
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-right: 1px solid #e9ecef;
  overflow-y: auto;
}

.filter-section, .stats-section {
  margin-bottom: 2rem;
}

h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

select {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ced4da;
}

.stats-section ul {
  list-style: none;
  padding: 0;
}

.stats-section li {
  padding: 0.5rem 0;
  display: flex;
  justify-content: space-between;
}

.map-area {
  flex-grow: 1;
  position: relative;
}

.map-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  font-size: 1.2rem;
}
</style>