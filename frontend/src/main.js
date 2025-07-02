import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Aura from '@primeuix/themes/aura';

import router from './router'

createApp(App).use(router).use(PrimeVue,{theme: {preset: Aura, options: {darkModeSelector: false}}}).use(ToastService).mount('#app')
