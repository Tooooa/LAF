<template>
  <div class="image-uploader">
    <div class="preview-list">
      <div v-for="(image, index) in previewUrls" :key="index" class="preview-item">
        <img :src="image.url" alt="preview" />
        <button @click="removeImage(index)" class="remove-btn">×</button>
        <div v-if="image.uploading" class="upload-overlay">
          <p>上传中...</p>
        </div>
      </div>
      <div v-if="previewUrls.length < maxImages" class="upload-placeholder" @click="triggerFileUpload">
        +
      </div>
    </div>
    <input
      type="file"
      ref="fileInput"
      @change="handleFileChange"
      accept="image/png, image/jpeg, image/gif"
      hidden
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { uploadImage } from '@/api/upload.js';

const props = defineProps({
  modelValue: { // 使用 v-model 接收和发送图片 URL 列表
    type: Array,
    default: () => [],
  },
  maxImages: {
    type: Number,
    default: 5,
  },
});

const emit = defineEmits(['update:modelValue']);

const fileInput = ref(null);
// 预览列表，包含本地预览URL和最终的服务器URL
const previewUrls = ref([]); 

// 初始化：如果 v-model 传入了已有的图片，则显示它们
watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal.length > 0 && previewUrls.value.length === 0) {
    previewUrls.value = newVal.map(url => ({ url, uploading: false }));
  }
}, { immediate: true });


const triggerFileUpload = () => {
  fileInput.value.click();
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const localUrl = URL.createObjectURL(file);
  const imageIndex = previewUrls.value.length;
  
  previewUrls.value.push({ url: localUrl, uploading: true });

  try {
    const res = await uploadImage(file);
    if (res.success) {
      // 上传成功后，用服务器返回的 URL 替换本地 URL
      previewUrls.value[imageIndex] = { url: res.data.url, uploading: false };
      
      // 更新 v-model
      const finalUrls = previewUrls.value.map(img => img.url);
      emit('update:modelValue', finalUrls);
    } else {
      // 上传失败，移除预览
      previewUrls.value.splice(imageIndex, 1);
      alert('图片上传失败: ' + res.message);
    }
  } catch (error) {
    previewUrls.value.splice(imageIndex, 1);
    alert('图片上传出错');
  } finally {
    // 清空 input 的值，以便可以再次选择同一张图片
    fileInput.value.value = '';
  }
};

const removeImage = (index) => {
  previewUrls.value.splice(index, 1);
  const finalUrls = previewUrls.value.map(img => img.url);
  emit('update:modelValue', finalUrls);
};
</script>

<style scoped>
.image-uploader { display: flex; }
.preview-list { display: flex; flex-wrap: wrap; gap: 10px; }
.preview-item, .upload-placeholder {
  width: 100px; height: 100px; border: 1px dashed #ccc;
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.upload-placeholder { cursor: pointer; font-size: 30px; color: #ccc; }
.preview-item img { width: 100%; height: 100%; object-fit: cover; }
.remove-btn {
  position: absolute; top: 2px; right: 2px;
  background-color: rgba(0,0,0,0.5); color: white;
  border: none; border-radius: 50%; width: 20px; height: 20px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  line-height: 1;
}
.upload-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex; align-items: center; justify-content: center;
}
</style>