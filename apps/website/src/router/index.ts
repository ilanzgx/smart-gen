import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ProfileView from '@/views/ProfileView.vue'
import RegisterView from '@/views/RegisterView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      alias: ['/signin', '/entrar/'],
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      alias: ['/painel'],
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      alias: ['/perfil', '/meu-perfil', '/eu', '/me'],
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      alias: ['/cadastro', '/signup/'],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
})

export default router
