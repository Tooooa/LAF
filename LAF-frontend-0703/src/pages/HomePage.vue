<template>
  <div class="home-page">
    <!-- 1. 顶部英雄/搜索区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <h1>校园失物招领平台</h1>
        <p>让每一次寻找，都有温暖的回应</p>
        <form @submit.prevent="handleIntelligentSearch" class="search-form">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="试着输入“在图书馆丢失的蓝色书包”"
            class="search-input"
          />
          <button type="submit" class="search-button" :disabled="isSearching">
            {{ isSearching ? '搜索中...' : '智能搜索' }}
          </button>
        </form>
      </div>
    </section>

    <!-- 2. 内容区域：最新寻物和最新招领 -->
    <main class="main-content">
      <!-- 最新寻物列表 -->
      <div class="list-section">
        <header class="list-header">
          <h2>最新寻物</h2>
          <router-link to="/items?type=lost" class="view-more">查看更多 →</router-link>
        </header>
        <div v-if="isLoading" class="loading-state">正在加载...</div>
        <div v-else-if="lostItems.length === 0" class="empty-state">暂无寻物信息</div>
        <div v-else class="items-grid">
          <ItemCard 
              v-for="item in lostItems" 
              :key="item.id" 
              :item-data="item"
            />
        </div>
      </div>

      <!-- 最新招领列表 -->
      <div class="list-section">
        <header class="list-header">
          <h2>最新招领</h2>
          <router-link to="/items?type=found" class="view-more">查看更多 →</router-link>
        </header>
        <div v-if="isLoading" class="loading-state">正在加载...</div>
        <div v-else-if="foundItems.length === 0" class="empty-state">暂无招领信息</div>
        <div v-else class="items-grid">
          <ItemCard 
              v-for="item in foundItems" 
              :key="item.id" 
              :item-data="item"
            />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getItemsList, intelligentSearch } from '@/api/items'; // 引入两个 API 函数
import ItemCard from '@/components/ItemCard.vue'; // 引入你已有的 ItemCard 组件

// -- 路由 --
const router = useRouter();

// -- 响应式状态 --
const searchQuery = ref('');
const isSearching = ref(false);
const lostItems = ref([]);
const foundItems = ref([]);
const isLoading = ref(true);

// -- 方法 --

// 智能搜索处理函数
const handleIntelligentSearch = async () => {
  if (!searchQuery.value.trim()) {
    alert('请输入您想搜索的内容。');
    return;
  }
  isSearching.value = true;
  try {
    // 调用智能搜索API
    const res = await intelligentSearch({ query: searchQuery.value });
    
    if (res.success && res.data.filters) {
      // 智能搜索API会返回提取的关键词和建议分类
      const { extractedKeywords, suggestedCategory } = res.data.filters;
      
      // 构建查询参数并跳转到物品列表页
      const queryParams = {};
      if (extractedKeywords && extractedKeywords.length > 0) {
        queryParams.keyword = extractedKeywords.join(' ');
      }
      if (suggestedCategory) {
        queryParams.category = suggestedCategory;
      }
      
      router.push({ path: '/items', query: queryParams });

    } else {
      // 如果智能搜索失败或无结果，则进行普通关键词跳转
      router.push({ path: '/items', query: { keyword: searchQuery.value } });
    }
  } catch (error) {
    console.error('Intelligent search failed:', error);
    alert('搜索时发生错误，将进行普通搜索。');
    // 降级为普通搜索
    router.push({ path: '/items', query: { keyword: searchQuery.value } });
  } finally {
    isSearching.value = false;
  }
};

// 获取首页列表数据
const fetchHomeData = async () => {
  isLoading.value = true;
  try {
    // 使用 Promise.all 并行请求，提高效率
    const [lostRes, foundRes] = await Promise.all([
      getItemsList({ type: 'lost', pageSize: 6, sortBy: 'createdAt', sortOrder: 'desc' }),
      getItemsList({ type: 'found', pageSize: 6, sortBy: 'createdAt', sortOrder: 'desc' })
    ]);

    // console.log('[DEBUG]: home_page lost response: ', lostRes);
    lostItems.value = lostRes;

    // console.log('[DEBUG]: home_page found response: ', foundRes);
    foundItems.value = foundRes;

  } catch (error) {
    console.error("Failed to fetch home data:", error);
    alert('加载首页数据失败，请稍后刷新重试。');
  } finally {
    isLoading.value = false;
  }
};

// -- 生命周期钩子 --
onMounted(() => {
  fetchHomeData();
});
</script>

<style scoped>
/* 使用统一的配色方案优化首页样式 */
.home-page {
  width: 100%;
  background: linear-gradient(135deg, #1F2544 0%, #474F7A 50%, #81689D 100%);
  min-height: 100vh;
  position: relative;
}

/* 顶部英雄区样式 - 与导航栏保持一致的渐变 */
.hero-section {
  background: linear-gradient(135deg, #1F2544 0%, #474F7A 30%, #81689D 70%, #FFD0EC 100%);
  color: white;
  padding: 100px 20px 120px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 20%, rgba(255, 208, 236, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(129, 104, 157, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

.hero-section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.1) 100%);
  border-radius: 50px 50px 0 0;
}

.hero-content {
  position: relative;
  z-index: 1;
  animation: fadeInUp 1s ease-out;
}

.hero-content h1 {
  font-size: clamp(2.5rem, 6vw, 4rem);
  margin-bottom: 25px;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 20px rgba(31, 37, 68, 0.4);
  background: linear-gradient(135deg, #ffffff 0%, #FFD0EC 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-content p {
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
  margin-bottom: 50px;
  opacity: 0.95;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.7;
  color: #FFD0EC;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.search-form {
  display: flex;
  justify-content: center;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  box-shadow: 0 25px 50px rgba(31, 37, 68, 0.3);
  border-radius: 60px;
  overflow: hidden;
  backdrop-filter: blur(15px);
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 208, 236, 0.3);
  transition: all 0.3s ease;
}

.search-form:hover {
  transform: translateY(-3px);
  box-shadow: 0 30px 60px rgba(31, 37, 68, 0.4);
}

.search-input {
  width: 70%;
  padding: 25px 30px;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  font-size: 1.2rem;
  outline: none;
  border-radius: 60px 0 0 60px;
  color: #1F2544;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.search-input:focus {
  background: rgba(255, 255, 255, 1);
  box-shadow: inset 0 0 0 3px rgba(129, 104, 157, 0.3);
}

.search-input::placeholder {
  color: #81689D;
  font-weight: 500;
}

.search-button {
  width: 30%;
  padding: 25px 30px;
  border: none;
  background: linear-gradient(135deg, #81689D 0%, #FFD0EC 100%);
  color: #1F2544;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: 0 60px 60px 0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.search-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.6s ease;
}

.search-button:hover::before {
  left: 100%;
}

.search-button:hover {
  background: linear-gradient(135deg, #FFD0EC 0%, #81689D 100%);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(129, 104, 157, 0.5);
}

.search-button:disabled {
  background: #474F7A;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  color: #81689D;
}

/* 主内容区样式 - 现代卡片布局 */
.main-content {
  padding: 80px 20px;
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 40px 40px 0 0;
  margin-top: -40px;
  position: relative;
  z-index: 2;
  box-shadow: 0 -20px 50px rgba(31, 37, 68, 0.2);
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 30%, rgba(129, 104, 157, 0.05) 0%, transparent 60%),
              radial-gradient(circle at 80% 70%, rgba(255, 208, 236, 0.05) 0%, transparent 60%);
  pointer-events: none;
  border-radius: 40px 40px 0 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 3px solid;
  border-image: linear-gradient(135deg, #81689D, #FFD0EC) 1;
  position: relative;
  z-index: 1;
}

.list-header h2 {
  font-size: 2rem;
  color: #1F2544;
  font-weight: 800;
  position: relative;
  background: linear-gradient(135deg, #1F2544 0%, #81689D 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.list-header h2::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 0;
  width: 80px;
  height: 4px;
  background: linear-gradient(135deg, #81689D, #FFD0EC);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(129, 104, 157, 0.3);
}

.view-more {
  color: #81689D;
  text-decoration: none;
  font-weight: 600;
  padding: 12px 24px;
  border: 2px solid #81689D;
  border-radius: 30px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.view-more::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #81689D, #FFD0EC);
  transition: left 0.3s ease;
  z-index: -1;
}

.view-more:hover::before {
  left: 0;
}

.view-more:hover {
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(129, 104, 157, 0.4);
  border-color: transparent;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  position: relative;
  z-index: 1;
}

.loading-state, .empty-state {
  color: #474F7A;
  padding: 80px 0;
  text-align: center;
  font-size: 1.2rem;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%);
  border-radius: 25px;
  margin: 20px 0;
  border: 2px solid rgba(129, 104, 157, 0.1);
  position: relative;
  overflow: hidden;
}

.loading-state {
  position: relative;
  overflow: hidden;
}

.loading-state::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 208, 236, 0.3), transparent);
  animation: shimmer 2s infinite;
}

/* 动画效果增强 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* 浮动动画效果 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.hero-content {
  animation: fadeInUp 1s ease-out, float 6s ease-in-out infinite;
}

/* 响应式设计优化 */
@media (max-width: 1200px) {
  .main-content {
    gap: 60px;
  }
}

@media (max-width: 992px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 50px;
  }
  
  .hero-section {
    padding: 80px 20px 100px;
  }
}

@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
    border-radius: 25px;
    max-width: 90%;
  }
  
  .search-input, .search-button {
    width: 100%;
    border-radius: 25px;
  }
  
  .search-button {
    margin-top: 15px;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .main-content {
    padding: 50px 15px;
    margin-top: -30px;
    border-radius: 25px 25px 0 0;
  }
  
  .hero-section {
    padding: 60px 15px 80px;
  }
  
  .hero-content h1 {
    font-size: 2.5rem;
  }
}

@media (max-width: 480px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .search-form {
    margin: 0 10px;
  }
  
  .hero-section {
    padding: 50px 15px 70px;
  }
  
  .main-content {
    padding: 40px 15px;
    gap: 40px;
  }
}

/* 增强视觉效果 */
.home-page * {
  transition: all 0.3s ease;
}

/* 滚动平滑效果 */
html {
  scroll-behavior: smooth;
}

/* 自定义滚动条 - 与配色方案统一 */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #81689D, #FFD0EC);
  border-radius: 10px;
  box-shadow: inset 0 0 5px rgba(31, 37, 68, 0.2);
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #474F7A, #81689D);
}

/* 添加一些微交互效果 */
.hero-section {
  background-attachment: fixed;
}

.search-form {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* 卡片悬停效果预留 */
.items-grid > * {
  transition: all 0.3s ease;
}

.items-grid > *:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(31, 37, 68, 0.15);
}

/* 加载动画优化 */
.loading-state::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border: 3px solid rgba(129, 104, 157, 0.2);
  border-top: 3px solid #81689D;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

/* 空状态优化 */
.empty-state {
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%);
  border: 2px dashed rgba(129, 104, 157, 0.3);
}

.empty-state::before {
  content: '🔍';
  font-size: 3rem;
  display: block;
  margin-bottom: 20px;
  opacity: 0.5;
}
</style>