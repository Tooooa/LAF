<template>
  <span class="status-badge" :class="badgeClass">
    {{ statusText }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

// 接收一个 'status' prop，可能是 'active' 或 'resolved'
const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ['active', 'resolved'].includes(value),
  },
});

// 根据 status 计算显示的文本
const statusText = computed(() => {
  return props.status === 'active' ? '进行中' : '已解决';
});

// 根据 status 计算应用的 CSS 类
const badgeClass = computed(() => {
  return {
    'status-active': props.status === 'active',
    'status-resolved': props.status === 'resolved',
  };
});
</script>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 0.25em 0.6em;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.375rem;
  color: #fff;
}

/* 蓝色 - 进行中 (寻物中/招领中) */
.status-active {
  background-color: #0d6efd; /* Bootstrap blue */
}

/* 绿色 - 已解决 (已找回/已认领) */
.status-resolved {
  background-color: #198754; /* Bootstrap green */
}
</style>