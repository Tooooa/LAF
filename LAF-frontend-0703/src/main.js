import { createApp } from 'vue'
// 1. 从 pinia 中导入 createPinia
import { createPinia } from 'pinia'
import router from './router' 
import App from './App.vue'
import './style.css' 

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)

app.use(router)

app.mount('#app')