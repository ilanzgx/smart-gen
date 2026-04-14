import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ProfileView from '@/views/ProfileView.vue'
import RegisterView from '@/views/RegisterView.vue'
import { useAuthStore } from '@/stores/auth.store'

/*
 * Todas as rotas listadas abaixo:
 *
 * / - Home (pública)
 * /login - Login (pública)
 * /register - Register (pública)
 * /dashboard - Dashboard (privada)
 * /profile - Profile (privada)
 * /:pathMatch(.*)* - 404 Not Found (pública)
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        public: true,
      },
    },
    {
      path: '/entrar',
      name: 'login',
      component: LoginView,
      alias: ['/signin', '/login'],
      meta: {
        public: true,
      },
    },
    {
      path: '/cadastrar',
      name: 'register',
      component: RegisterView,
      alias: ['/cadastro', '/signup', '/register'],
      meta: {
        public: true,
      },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      alias: ['/painel'],
    },
    {
      path: '/perfil',
      name: 'profile',
      component: ProfileView,
      alias: ['/profile', '/meu-perfil', '/eu', '/me'],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: {
        public: true,
      },
    },
  ],
})

/*
 * Antes de cada rota:
 * - Verifica se a rota é pública
 * - Verifica se o usuário está autenticado
 * - Redireciona para o login se a rota não for pública e o usuário não estiver autenticado
 * - Redireciona para o dashboard se o usuário estiver autenticado e tentar acessar a página de login ou registro
 */
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isPublic = to.meta.public === true

  // Se a rota não for pública e o usuário não estiver autenticado,
  // redireciona para o login
  if (!isPublic && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  // Se o usuário estiver autenticado e tentar acessar a página de login ou registro,
  // redireciona para o dashboard
  if (authStore.isAuthenticated && (to.name === 'login' || to.name === 'register')) {
    return next({ name: 'dashboard' })
  }

  // Segue o fluxo normal
  next()
})

export default router
