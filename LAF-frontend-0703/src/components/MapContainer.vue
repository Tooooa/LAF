<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue';

// --- 本地 SVG 图标 ---
// 1. 从你的项目中导入本地 SVG 文件。
//    请确保路径正确，'@' 通常指向 'src' 目录。
//    你需要将 'lost-icon.svg' 和 'found-icon.svg' 替换为你的实际文件名。
import lostIconUrl from '@/assets/icons/lost-icon.svg';
import foundIconUrl from '@/assets/icons/found-icon.svg';


// --- Props and Emits ---
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
});
const emit = defineEmits(['map-bounds-changed']);


// --- State ---
const mapContainer = ref(null); // 用于绑定模板中的 div 元素
const mapInstance = ref(null); // 存储高德地图实例
const markersLayer = ref([]); // 用一个数组来存储所有 marker 实例，方便清除


// --- Lifecycle Hooks ---
onMounted(() => {
  if (typeof AMap === 'undefined') {
    console.error("高德地图JS API未加载或加载失败！");
    return;
  }
  nextTick(() => {
    initMap();
  });
});

onUnmounted(() => {
  if (mapInstance.value) {
    mapInstance.value.destroy();
    mapInstance.value = null;
  }
});


// --- Map Logic ---

const initMap = () => {
  if (!mapContainer.value) return;

  mapInstance.value = new AMap.Map(mapContainer.value, {
    zoom: 17,
    center: [116.2922, 40.1585],
    viewMode: '2D',
  });

  mapInstance.value.addControl(new AMap.Scale());
  mapInstance.value.addControl(new AMap.ToolBar());

  mapInstance.value.on('complete', handleMapChange);
};

const handleMapChange = () => {
  if (!mapInstance.value) return;
  const bounds = mapInstance.value.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const newBounds = {
    minLat: sw.getLat(),
    minLng: sw.getLng(),
    maxLat: ne.getLat(),
    maxLng: ne.getLng()
  };
  emit('map-bounds-changed', newBounds);
};


/**
 * 【已修改】根据物品类型创建自定义图标
 * 现在此函数使用导入的本地 SVG 文件
 */
function createIcon(itemType) {
  // 2. 根据物品类型，选择对应的 SVG 图标 URL
  const iconUrl = itemType === 'lost'
    ? lostIconUrl   // 使用导入的失物 SVG
    : foundIconUrl; // 使用导入的拾物 SVG

  return new AMap.Icon({
    // 3. 设置图标的尺寸。这个尺寸需要根据你的 SVG 文件进行调整。
    size: new AMap.Size(32, 32), // 示例尺寸：宽32px, 高32px
    // image 属性可以直接使用 import 进来的 URL
    image: iconUrl,
    // imageSize 也需要设置为你的图标尺寸
    imageSize: new AMap.Size(32, 32),
  });
}


// --- Watcher to update markers ---
watch(() => props.items, (newItems) => {
  if (!mapInstance.value) return;

  // 1. 清除旧标记
  mapInstance.value.remove(markersLayer.value);
  markersLayer.value = [];

  // 2. 创建新标记
  newItems.forEach(item => {
    if (item.coordinates?.latitude && item.coordinates?.longitude) {
      const marker = new AMap.Marker({
        position: new AMap.LngLat(item.coordinates.longitude, item.coordinates.latitude),
        icon: createIcon(item.type),
        // 4. 【重要】调整图标偏移量，使其底部尖端对准坐标点。
        //    偏移量计算：(-图标宽度 / 2, -图标高度)
        //    例如，对于 32x32 的图标，偏移量是 (-16, -32)。请根据你的图标尺寸调整。
        offset: new AMap.Pixel(-16, -32),
      });

      // 设置弹窗内容
      const infoWindowContent = `
        <div style="font-family: sans-serif; padding: 5px;">
          <strong>${item.title}</strong><br>
          类型: ${item.type === 'lost' ? '失物' : '拾物'}<br>
          地点: ${item.location}
        </div>`;

      // 点击标记时显示信息窗体
      marker.on('click', () => {
        const infoWindow = new AMap.InfoWindow({
          content: infoWindowContent,
        });
        infoWindow.open(mapInstance.value, marker.getPosition());
      });

      markersLayer.value.push(marker);
    }
  });

  // 3. 将所有新标记添加到地图
  mapInstance.value.add(markersLayer.value);

}, { deep: true });

</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>