// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/user.js'; 
// 1. 静态导入组件
import ItemsListPage from '../pages/ItemsListPage.vue';
import ItemDetailPage from '../pages/ItemDetailPage.vue';
import AuthPage from '../pages/AuthPage.vue';
import PublishPage from '../pages/PublishPage.vue';
import UserDashboardPage from '../pages/UserDashboardPage.vue';
import HomePage from '../pages/HomePage.vue';
import MyPosts from '../pages/dashboard/MyPosts.vue';
import MyMessages from '../pages/dashboard/MyMessages.vue';
import MyNotifications from '../pages/dashboard/MyNotifications.vue';
import ProfileSettings from '../pages/dashboard/ProfileSettings.vue';
import MapViewPage from '@/pages/MapViewPage.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage, // 将根路径指向 HomePage
  },
  {
    path: '/items',
    name: 'ItemsList',
    component: ItemsListPage,
  },
  // 2. 添加根路径重定向
  {
    path: '/',
    redirect: '/items'
  },
  {
    // 3. 规范化命名
    path: '/items',
    name: 'ItemsList',
    component: ItemsListPage
  },
  {
    // 3. 规范化路径和命名
    path: '/items/:id',
    name: 'ItemDetail',
    component: ItemDetailPage,
    props: true // 4. 开启 props 传参，解耦组件
  },
  {
    // 4. 新增登录页路由
    path: '/login',
    name: 'Auth',
    component: AuthPage
  },
  // --- 需要登录权限的路由 ---
  {
    path: '/publish',
    name: 'Publish',
    component: PublishPage, // 暂时注释掉，因为文件还未创建
    meta: { requiresAuth: true } // <--- 添加 meta 字段
  },
  // 新增的地图模式路由
  {
    path: '/map',
    name: 'MapView',
    component: MapViewPage,
    meta: { requiresAuth: true } // 如果需要登录才能看地图
  },
  // 新增的个人中心路由
  {
    path: '/dashboard',
    redirect: '/dashboard/posts', // 默认重定向到“我发布的”
    component: UserDashboardPage,
    meta: { requiresAuth: true }, // 访问个人中心需要登录
    children: [
      {
        path: 'posts',
        name: 'DashboardPosts',
        component: MyPosts,
      },
      {
        path: 'messages',
        name: 'DashboardMessages',
        component: MyMessages,
      },
      {
        path: 'notifications',
        name: 'DashboardNotifications',
        component: MyNotifications,
      },
      // todo: 个人资料设置
      { 
        path: 'settings',
        name: 'DashboardSettings',
        component: ProfileSettings,
      },
    ],
  },
    // 新增路由
  { 
    path: '/publish', 
    name: 'Publish', 
    component: PublishPage,
    meta: { requiresAuth: true } // 标记需要登录
  },
  { 
    path: '/edit/:id', 
    name: 'EditItem', 
    component: PublishPage, // 复用 PublishPage
    meta: { requiresAuth: true } 
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});
// --- 全局前置守卫 ---
router.beforeEach((to, from, next) => {
  // 1. 获取 Pinia store。注意：不能在顶层作用域直接调用 useUserStore()，
  // 因为 Pinia 实例此时可能还未挂载到 app。必须在 beforeEach 内部获取。
  const userStore = useUserStore();
  const isLoggedIn = userStore.isLoggedIn;

  // 2. 检查目标路由是否需要登录
  if (to.meta.requiresAuth && !isLoggedIn) {
    // 3. 如果需要登录但用户未登录，则重定向到登录页
    alert('此页面需要登录才能访问，请先登录。'); // (可选) 给用户一个提示
    next({ name: 'Auth' }); // 使用路由名称进行重定向，更健壮
  } else {
    // 4. 如果不需要登录，或者用户已登录，则正常放行
    next();
  }
});
export default router;