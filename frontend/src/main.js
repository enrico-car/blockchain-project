import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

const app = createApp(App)
app.config.globalProperties.$api = api
app.mount('#app')