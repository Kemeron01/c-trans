import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '@/views/AuthLayout.vue';
import MainLayout from "@/LayOut/MainLayout.vue";
import Dashboard from '@/views/Dashboard.vue'
import Admins from "@/pages/Admins/Admins.vue";
import Banner from "@/pages/Banner/Banner.vue";
import Buyurtmalar from "@/pages/Buyurtmalar/Buyurtmalar.vue";
import BuyurtmaEdit from "@/pages/Buyurtmalar/BuyurtmaEdit.vue";
import Comment from "@/pages/Comment/Comment.vue";
import Jonatma from "@/pages/Jonatma/Jonatma.vue";
import JonatmaEdit from "@/pages/Jonatma/JonatmaEdit.vue";
import JonatmaQoshish from "@/pages/Jonatma/JonatmaQoshish.vue";
import LidEdit from "@/pages/Lid/LidEdit.vue";
import Lids from "@/pages/Lid/Lids.vue";
import Users from "@/pages/Users/Users.vue";
import UserEdit from "@/pages/Users/UserEdit.vue";



const routes = [
  {
    path: '/',
    name: 'Auth',
    component: AuthLayout
  },
  {
    path: '/app',
    component: MainLayout, 
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard
      },
      {
        path:'/admins',
        name:'Admins',
        component:Admins
      },
      {
        path:'/banner',
        name:'Banner',
        component:Banner
      },
      {
        path:'/buyurtmalar',
        name:'Buyurtmalar',
        component:Buyurtmalar
      },
      {
        path:'/buyurtmaEdit/:id',
        name:'BuyurtmaEdit',
        component:BuyurtmaEdit
      },
      {
        path:'/comment',
        name:'Comment',
        component:Comment
      },
      {
        path:'/jonatma',
        name:'Jonatma',
        component:Jonatma
      },
      {
        path:'/jonatmaEdit',
        name:'JonatmaEdit',
        component:JonatmaEdit
      },
      {
        path:'/jonatmaQoshish',
        name:'JonatmaQoshish',
        component:JonatmaQoshish
      },
      {
        path:'/lidEdit',
        name:'LidEdit',
        component:LidEdit
      },
      {
        path:'/lids',
        name:'Lids',
        component:Lids
      },
      {
        path:'/users',
        name:'Users',
        component:Users
      },
      {
        path:'/userEdit',
        name:'UserEdit',
        component:UserEdit
      }
    ]
  }
  ]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
