<!-- src/components/MapContainer.vue -->
<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, shallowRef } from 'vue';

// 定义 props 接收父组件传递的数据
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  heatmapData: {
    type: Array,
    default: () => [],
  },
});

// 定义 emits，用于向父组件传递事件，例如地图边界变化
const emit = defineEmits(['map-bounds-changed']);

const mapContainer = ref(null);
// 使用 shallowRef 存储地图实例，避免深度代理带来的性能问题
const mapInstance = shallowRef(null);
const heatmap = shallowRef(null);
const markers = [];

// 初始化地图
const initMap = () => {
  if (!mapContainer.value) return;

  mapInstance.value = new AMap.Map(mapContainer.value, {
    zoom: 17,
    center: [116.2922, 40.1585], // 默认中心点，可以设为学校中心
    viewMode: '2D',
  });

  // 添加地图控件
  mapInstance.value.addControl(new AMap.Scale());
  mapInstance.value.addControl(new AMap.ToolBar());

  // 监听地图移动结束事件
  mapInstance.value.on('moveend', handleMapChange);
  mapInstance.value.on('zoomend', handleMapChange);
  
  // 触发一次初始事件
  handleMapChange();
};

// 处理地图变化，发送事件给父组件
const handleMapChange = () => {
    if (!mapInstance.value) return;
    const bounds = mapInstance.value.getBounds();
    const sw = bounds.getSouthWest(); // 西南角
    const ne = bounds.getNorthEast(); // 东北角
    const boundsString = `${sw.getLng()},${sw.getLat()},${ne.getLng()},${ne.getLat()}`;
    emit('map-bounds-changed', boundsString);
};

// 渲染物品标记点
const renderMarkers = () => {
  if (!mapInstance.value) return;
  // 先清除旧的标记
  mapInstance.value.remove(markers);
  markers.length = 0;

  props.items.forEach(item => {
    const marker = new AMap.Marker({
      position: [item.coordinates.longitude, item.coordinates.latitude],
      title: item.title,
      // 你可以自定义图标
      // icon: item.type === 'lost' ? 'lost-icon.png' : 'found-icon.png',
    });
    
    // 点击标记点可以显示信息窗体
    const infoWindow = new AMap.InfoWindow({
        content: `<h3>${item.title}</h3><p>位置: ${item.location}</p><a href="/items/${item.id}" target="_blank">查看详情</a>`
    });
    marker.on('click', () => {
        infoWindow.open(mapInstance.value, marker.getPosition());
    });
    
    markers.push(marker);
  });
  // 将新的标记添加到地图
  mapInstance.value.add(markers);
};

// 渲染热力图
const renderHeatmap = () => {
  if (!mapInstance.value) return;

  if (!heatmap.value) {
    // 初始化热力图插件
    heatmap.value = new AMap.HeatMap(mapInstance.value, {
      radius: 25,
      opacity: [0, 0.8],
      // gradient: { 0.5: 'blue', 0.65: 'rgb(117,211,248)', 0.7: 'rgb(0, 255, 0)' ...}
    });
  }

  // 设置热力图数据集
  heatmap.value.setDataSet({
    data: props.heatmapData.map(p => ({
      lng: p.coordinates.longitude,
      lat: p.coordinates.latitude,
      count: p.weight,
    })),
    max: 10, // 数据集中的最大权重
  });
};

// 监听 props 变化来更新地图
import { watch } from 'vue';
watch(() => props.items, renderMarkers, { deep: true });
watch(() => props.heatmapData, renderHeatmap, { deep: true });


onMounted(() => {
  initMap();
});

// 组件卸载时销毁地图实例
onUnmounted(() => {
  if (mapInstance.value) {
    mapInstance.value.destroy();
  }
});

</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>