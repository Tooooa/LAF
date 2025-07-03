<template>
  <div class="item-card">
    <div class="card-image-wrapper">
      <img :src="imageUrl" @error="onImageError" alt="物品图片" class="card-image" />
      <!-- 类型标签：寻 / 招 -->
      <span class="card-type-label" :class="typeClass">{{ typeText }}</span>
    </div>
    <div class="card-content">
      <h3 class="card-title">{{ itemData.title }}</h3>
      <p class="card-info">
        <span class="info-icon">📍</span>
        <span>{{ itemData.location }}</span>
      </p>
      <p class="card-info">
        <span class="info-icon">📅</span>
        <span>{{ itemData.date }}</span>
      </p>
    </div>
    <div class="card-footer">
      <!-- 状态徽章 -->
      <StatusBadge :status="itemData.status" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import StatusBadge from './StatusBadge.vue';
import defaultImage from '@/assets/default-image.png'; // 确保你的项目中有名为 default-image.png 的默认图片

// 接收一个完整的物品对象作为 prop
const props = defineProps({
  itemData: {
    type: Object,
    required: true,
  },
});

// 计算图片 URL，如果 itemData 中没有图片，则使用默认图片
const imageUrl = computed(() => {
  return props.itemData.imageUrl || defaultImage;
});

// 处理图片加载失败的事件，强制显示默认图片
const onImageError = (event) => {
  event.target.src = defaultImage;
};

// 根据类型（lost/found）计算文本和样式
const typeText = computed(() => (props.itemData.type === 'lost' ? '寻' : '招'));
const typeClass = computed(() => (props.itemData.type === 'lost' ? 'type-lost' : 'type-found'));

</script>

<style scoped>
.item-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
}

.item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 75%; /* 4:3 Aspect Ratio */
  background-color: #f0f0f0;
}

.card-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保证图片覆盖整个区域而不变形 */
}

.card-type-label {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
}

.type-lost {
  background-color: #dc3545; /* 红色 */
}

.type-found {
  background-color: #ffc107; /* 黄色 */
  color: #333;
}

.card-content {
  padding: 12px 16px;
  flex-grow: 1; /* 让内容区域占据剩余空间 */
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  /* 限制标题为一行，超出部分显示省略号 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-info {
  font-size: 0.9rem;
  color: #666;
  margin: 4px 0;
  display: flex;
  align-items: center;
}

.info-icon {
  margin-right: 6px;
}

.card-footer {
  padding: 0 16px 12px;
  text-align: right;
}
</style>