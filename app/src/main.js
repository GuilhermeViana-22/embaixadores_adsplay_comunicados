import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useThemeStore } from '@/stores/theme'

const app = createApp(App).use(createPinia()).use(router)
useThemeStore().apply() // aplica modo claro/escuro e cor primária salvos antes de mostrar a tela
app.mount('#app')
