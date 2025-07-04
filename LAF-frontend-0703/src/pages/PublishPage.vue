<template>
  <div class="publish-page-container">
    <h1>{{ isEditMode ? '编辑物品信息' : '发布新的信息' }}</h1>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>类型</label>
        <select v-model="formData.type" required>
          <option value="lost">我丢失了物品</option>
          <option value="found">我捡到了物品</option>
        </select>
      </div>

      <div class="form-group">
        <label for="title">标题</label>
        <input id="title" type="text" v-model="formData.title" placeholder="例如：一个黑色的苹果手机" required />
      </div>

      <div class="form-group">
        <label for="description">详细描述</label>
        <textarea id="description" v-model="formData.description" rows="5" placeholder="请详细描述物品特征、丢失/拾取的时间地点等" required></textarea>
      </div>

      <div class="form-group">
        <label for="category">分类</label>
        <!-- 分类数据应从 API 获取或在前端硬编码，这里先做个示例 -->
        <select id="category" v-model="formData.category" required>
          <option value="electronics">电子产品</option>
          <option value="accessories">配饰用品</option>
          <option value="documents">证件文件</option>
          <option value="elsethings">其他</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="location">地点</label>
        <!-- todo 这里的地点选择还没实现 -->
        <!-- 两个值，location_id和location_detail -->
        <LocationInput id="location" v-model="formData.location_detail" />
      </div>

      <div class="form-group">
        <label for="lost_date">{{ formData.type === 'lost' ? '丢失日期' : '拾取日期' }}</label>
        <input id="lost_date" type="date" v-model="formData.lost_date" required />
      </div>

      <div class="form-group">
        <label for="contact_info">联系方式 (手机号/微信/QQ)</label>
        <input id="contact_info" type="text" v-model="formData.contact_info" required />
      </div>

      <div class="form-group">
        <label>上传图片</label>
        <ImageUploader v-model="formData.images" :max-images="5" />
      </div>

      <div class="form-group">
        <label for="tags">标签 (用逗号分隔)</label>
        <input id="tags" type="text" v-model="tagsInput" placeholder="例如：钱包,蓝色,皮质" />
      </div>

      <button type="submit" class="submit-btn" :disabled="isSubmitting">
        {{ isSubmitting ? '提交中...' : (isEditMode ? '更新信息' : '确认发布') }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createItem, updateItem, getItemById } from '@/api/items.js';
import ImageUploader from '../components/ImageUploader.vue';
import LocationInput from '../components/LocationInput.vue';
import { useUserStore } from '@/store/user.js'; 

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const isEditMode = ref(false);
const itemId = ref(null);
const isSubmitting = ref(false);

console.log('[test2]: ', userStore.user.id);


const formData = ref({
  type: 'lost',
  title: '',
  description: '',
  category: 'electronics', // 默认值
  location_detail: '',
  lost_date: new Date().toISOString().split('T')[0], // 默认为今天
  contact_info: '',
  author_id: userStore.user.id,
  images: [],
  tags: [],
});

// 因为 tags 在表单中是字符串，在提交时是数组，所以用一个 computed property 转换
const tagsInput = computed({
  get: () => formData.value.tags.join(','),
  set: (val) => {
    formData.value.tags = val.split(',').map(tag => tag.trim()).filter(Boolean);
  }
});

const loadItemData = async () => {
  if (!route.params.id) return;
  
  isEditMode.value = true;
  itemId.value = route.params.id;
  isLoading.value = true;
  loadError.value = null;
  
  try {
    const res = await getItemById(itemId.value);
    
    if (!res.success) {
      throw new Error('获取物品信息失败');
    }
    
    // 映射API数据到表单
    const { data: item } = res;
    formData.value = {
      type: item.type,
      title: item.title,
      description: item.description,
      category: item.category?.code || item.category, // 兼容不同API结构
      location_detail: item.location_detail || '',
      lost_date: item.lost_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      contact_info: item.contact_info,
      images: item.images || [],
      tags: item.tags || [],
    };
  } catch (error) {
    console.error('加载物品数据失败:', error);
    loadError.value = error.message;
    router.push('/'); // 或者显示错误信息而不是直接跳转
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  loadItemData().catch(error => {
    console.error('初始化错误:', error);
  });
});

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    let res;
    if (isEditMode.value) {
      res = await updateItem(itemId.value, formData.value);
    } else {
      res = await createItem(formData.value);
    }

    // console.log('[DEBUG]: ', res);
    if (res.code == 201) {
      alert(isEditMode.value ? '更新成功！' : '发布成功！');
      // 跳转到物品详情页
      router.push(`/items/${res.id}`);
    } else {
      alert('操作失败: ' + res.code);
    }
  } catch (error) {
    console.error('Submit error:', error);
    alert('提交失败，请检查网络或联系管理员。');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.publish-page-container { max-width: 800px; margin: 20px auto; padding: 20px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: bold; }
input[type="text"], input[type="date"], textarea, select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.submit-btn {
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}
.submit-btn:disabled { background-color: #ccc; cursor: not-allowed; }
</style>