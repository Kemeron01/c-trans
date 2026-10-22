import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '@/views/AuthLayout.vue';
import MainLayout from "@/LayOut/MainLayout.vue";

// Sahifalar lazy-load qilinadi — bundle kichikroq bo'ladi
const routes = [
  {
    path: '/',
    name: 'Auth',
    component: AuthLayout
  },
  {
    path: '/app',
    component: MainLayout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: 'Dashboard' } },
      { path: '/admins', name: 'Admins', component: () => import('@/pages/Admins/Admins.vue'), meta: { title: 'Adminlar' } },
      { path: '/banner', name: 'Banner', component: () => import('@/pages/Banner/Banner.vue'), meta: { title: 'Mobil banner' } },
      { path: '/buyurtmalar', name: 'Buyurtmalar', component: () => import('@/pages/Buyurtmalar/Buyurtmalar.vue'), meta: { title: 'Buyurtmalar' } },
      { path: '/buyurtmaEdit/:id', name: 'BuyurtmaEdit', component: () => import('@/pages/Buyurtmalar/BuyurtmaEdit.vue'), meta: { title: 'Buyurtma' } },
      { path: '/comment', name: 'Comment', component: () => import('@/pages/Comment/Comment.vue'), meta: { title: 'Sharhlar' } },
      { path: '/jonatma', name: 'Jonatma', component: () => import('@/pages/Jonatma/Jonatma.vue'), meta: { title: "Jo'natmalar" } },
      { path: '/jonatmaEdit', name: 'JonatmaEdit', component: () => import('@/pages/Jonatma/JonatmaEdit.vue'), meta: { title: "Jo'natma" } },
      { path: '/jonatmaQoshish', name: 'JonatmaQoshish', component: () => import('@/pages/Jonatma/JonatmaQoshish.vue'), meta: { title: "Jo'natma qo'shish" } },
      { path: '/lidEdit', name: 'LidEdit', component: () => import('@/pages/Lid/LidEdit.vue'), meta: { title: 'Lid' } },
      { path: '/lids', name: 'Lids', component: () => import('@/pages/Lid/Lids.vue'), meta: { title: 'Lidlar' } },
      { path: '/users', name: 'Users', component: () => import('@/pages/Users/Users.vue'), meta: { title: 'Foydalanuvchilar' } },
      { path: '/userEdit', name: 'UserEdit', component: () => import('@/pages/Users/UserEdit.vue'), meta: { title: 'Foydalanuvchi' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
  ]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (to.matched.some(r => r.meta.requiresAuth) && !token) return '/'
  if (to.name === 'Auth' && token) return '/dashboard'
})

export default router
