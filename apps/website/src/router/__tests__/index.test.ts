import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/views/HomeView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/AboutView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/NotFoundView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/LoginView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/DashboardView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/GeneratorsView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/ProfileView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/RegisterView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/RecoverPasswordView.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/UpdatePasswordView.vue', () => ({ default: { template: '<div />' } }))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}))

import router from '../index'
import { useAuthStore } from '@/stores/auth.store'

describe('router rotas e configurações testes unitários', () => {
  describe('router navigation', () => {
    let authStoreMock: any

    beforeEach(() => {
      setActivePinia(createPinia())
      vi.clearAllMocks()

      authStoreMock = {
        isAuthenticated: false,
        isInitialized: true,
        initializeAuth: vi.fn(),
      }
      vi.mocked(useAuthStore).mockReturnValue(authStoreMock)
    })

    it('deve redirecionar para login ao acessar rota privada deslogado', async () => {
      // Arrange
      authStoreMock.isAuthenticated = false

      // Act
      await router.push('/dashboard')

      // Assert
      expect(router.currentRoute.value.name).toBe('login')
    })

    it('deve permitir acesso a rotas públicas mesmo deslogado', async () => {
      // Arrange
      authStoreMock.isAuthenticated = false

      // Act
      await router.push('/')

      // Assert
      expect(router.currentRoute.value.name).toBe('home')
    })

    it('deve redirecionar para dashboard se usuário logado tentar acessar login', async () => {
      // Arrange
      authStoreMock.isAuthenticated = true

      // Act
      await router.push('/entrar')

      // Assert
      expect(router.currentRoute.value.name).toBe('dashboard')
    })

    it('deve permitir acesso a rotas privadas se estiver logado', async () => {
      // Arrange
      authStoreMock.isAuthenticated = true

      // Act
      await router.push('/dashboard')

      // Assert
      expect(router.currentRoute.value.name).toBe('dashboard')
    })

    it('deve permitir acesso a rotas públicas mesmo estando logado', async () => {
      // Arrange
      authStoreMock.isAuthenticated = true

      // Act
      await router.push('/about')

      // Assert
      expect(router.currentRoute.value.name).toBe('about')
    })
  })

  describe('router rotas e configurações', () => {
    it('deve conter a rota home com path "/"', () => {
      // Arrange & Act
      const homeRoute = router.getRoutes().find((route) => route.name === 'home')

      // Assert
      expect(homeRoute).toBeDefined()
      expect(homeRoute?.path).toBe('/')
    })

    it('deve conter uma rota de fallback (404) para caminhos inexistentes', () => {
      // Arrange & Act
      const routes = router.getRoutes()
      const notFoundRoute = routes.find((route) => route.name === 'not-found')

      // Assert
      expect(notFoundRoute).toBeDefined()
      expect(notFoundRoute?.path).toBe('/:pathMatch(.*)*')
    })

    it('deve ter meta public: true na rota de login e register', () => {
      // Arrange & Act
      const loginRoute = router.getRoutes().find((route) => route.name === 'login')
      const registerRoute = router.getRoutes().find((route) => route.name === 'register')

      // Assert
      expect(loginRoute?.meta?.public).toBe(true)
      expect(registerRoute?.meta?.public).toBe(true)
    })

    it('deve conter as rotas de recuperação e atualização de senha', () => {
      // Arrange & Act
      const recoverRoute = router.getRoutes().find((route) => route.name === 'recover-password')
      const updateRoute = router.getRoutes().find((route) => route.name === 'update-password')

      // Assert
      expect(recoverRoute).toBeDefined()
      expect(recoverRoute?.path).toBe('/recuperar-senha')
      expect(recoverRoute?.meta?.public).toBe(true)

      expect(updateRoute).toBeDefined()
      expect(updateRoute?.path).toBe('/atualizar-senha')
      expect(updateRoute?.meta?.public).toBe(true)
    })
  })

  describe('router navegação - recuperação de senha', () => {
    let authStoreMock: any

    beforeEach(async () => {
      setActivePinia(createPinia())
      vi.clearAllMocks()

      authStoreMock = {
        isAuthenticated: false,
        isInitialized: true,
        hasError: false,
        initializeAuth: vi.fn(),
        clearError: vi.fn(),
      }
      vi.mocked(useAuthStore).mockReturnValue(authStoreMock)

      // Reset router para evitar estado residual de outros testes
      await router.push('/')
    })

    it('deve permitir acesso à rota de recuperar senha estando deslogado', async () => {
      // Arrange
      authStoreMock.isAuthenticated = false

      // Act
      await router.push('/recuperar-senha')

      // Assert
      expect(router.currentRoute.value.name).toBe('recover-password')
    })

    it('deve redirecionar para dashboard se logado tentar acessar recuperar senha', async () => {
      // Arrange
      authStoreMock.isAuthenticated = true

      // Act
      await router.push('/recuperar-senha')

      // Assert
      expect(router.currentRoute.value.name).toBe('dashboard')
    })

    it('deve permitir acesso à rota de atualizar senha estando deslogado (pública)', async () => {
      // Arrange
      authStoreMock.isAuthenticated = false

      // Act
      await router.push('/atualizar-senha')

      // Assert
      expect(router.currentRoute.value.name).toBe('update-password')
    })

    it('deve permitir acesso à rota de atualizar senha estando logado', async () => {
      // Arrange
      authStoreMock.isAuthenticated = true

      // Act
      await router.push('/atualizar-senha')

      // Assert
      expect(router.currentRoute.value.name).toBe('update-password')
    })
  })
})
