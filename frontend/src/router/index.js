// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// Importa i componenti per le pagine
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Manufacturer from '@/views/Manufacturer.vue'
import Inventory from '@/views/Inventory.vue'
import Cashback from '@/views/Cashback.vue'
// import About from '../views/About.vue'
// import Product from '../views/Product.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/home/:account',
    name: 'Home',
    component: Home,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/manufacturer/:account',
    name: 'Manufacturer',
    component: Manufacturer,
  },
  {
    path: '/inventory/:account',
    name: 'Inventory',
    component: Inventory,
  },
  {
    path: '/cashback/:account',
    name: 'Cashback',
    component: Cashback,
  },
]

const router = createRouter({
  history: createWebHistory(), // oppure createWebHashHistory() se preferisci URL con #
  routes,
})

export default router
