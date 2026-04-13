import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth.store'
import * as supabasePkg from '@smart-gen/supabase'

vi.mock('@smart-gen/supabase', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

describe('Auth Store - Testes Unitários', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('deve inicializar com valores padrão', () => {
    // Arrange & Act
    const store = useAuthStore()

    // Assert
    expect(store.user).toBeNull()
    expect(store.session).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.hasError).toBe(false)
  })

  describe('signIn', () => {
    it('deve fazer login com sucesso', async () => {
      // Arrange
      const store = useAuthStore()
      const mockUser = { id: '1', email: 'test@test.com' }
      const mockSession = { access_token: 'token' }

      vi.mocked(supabasePkg.signIn).mockResolvedValue({
        user: mockUser as any,
        session: mockSession as any,
      })

      // Act
      await store.signIn({ email: 'test@test.com', password: 'password' })

      // Assert
      expect(store.user).toEqual(mockUser)
      expect(store.session).toEqual(mockSession)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('deve capturar erro em falha de login', async () => {
      // Arrange
      const store = useAuthStore()
      const errorMessage = 'Invalid credentials'
      vi.mocked(supabasePkg.signIn).mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(store.signIn({ email: 'wrong@test.com', password: '123' })).rejects.toThrow(
        errorMessage,
      )

      // Assert
      expect(store.user).toBeNull()
      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
      expect(store.hasError).toBe(true)
    })
  })

  describe('signUp', () => {
    it('deve cadastrar usuário com sucesso', async () => {
      // Arrange
      const store = useAuthStore()
      const mockUser = { id: '2', email: 'new@test.com' }
      const mockSession = { access_token: 'new-token' }

      vi.mocked(supabasePkg.signUp).mockResolvedValue({
        user: mockUser as any,
        session: mockSession as any,
      })

      // Act
      await store.signUp({ email: 'new@test.com', password: 'password' })

      // Assert
      expect(store.user).toEqual(mockUser)
      expect(store.session).toEqual(mockSession)
      expect(store.loading).toBe(false)
    })

    it('deve capturar erro em falha de cadastro', async () => {
      // Arrange
      const store = useAuthStore()
      const errorMessage = 'User already exists'
      vi.mocked(supabasePkg.signUp).mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(store.signUp({ email: 'existing@test.com', password: '123' })).rejects.toThrow(
        errorMessage,
      )

      // Assert
      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
    })
  })

  describe('signOut', () => {
    it('deve limpar o estado após deslogar com sucesso', async () => {
      // Arrange
      const store = useAuthStore()
      store.user = { id: '1' } as any
      store.session = { access_token: 'abc' } as any

      vi.mocked(supabasePkg.signOut).mockResolvedValue(undefined as any)

      // Act
      await store.signOut()

      // Assert
      expect(store.user).toBeNull()
      expect(store.session).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('deve capturar erro se o logout falhar', async () => {
      // Arrange
      const store = useAuthStore()
      const errorMessage = 'Logout failed'
      vi.mocked(supabasePkg.signOut).mockRejectedValue(new Error(errorMessage))

      // Act
      await expect(store.signOut()).rejects.toThrow(errorMessage)

      // Assert
      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
    })
  })

  describe('initializeAuth', () => {
    it('deve configurar o listener e buscar sessão inicial', async () => {
      // Arrange
      const store = useAuthStore()
      const mockSession = { user: { id: '123' } } as any

      vi.mocked(supabasePkg.getSession).mockResolvedValue(mockSession)
      vi.mocked(supabasePkg.getUser).mockResolvedValue(mockSession.user)

      // Act
      const unsubscribe = await store.initializeAuth()

      // Assert
      expect(typeof unsubscribe).toBe('function')
      expect(supabasePkg.getSession).toHaveBeenCalled()
      expect(supabasePkg.getUser).toHaveBeenCalled()

      expect(store.session).toEqual(mockSession)
      expect(store.user).toEqual(mockSession.user)
    })
  })

  describe('Reactive States & Getters', () => {
    it('loading deve mudar durante as ações', async () => {
      // Arrange
      const store = useAuthStore()
      vi.mocked(supabasePkg.signIn).mockImplementation(() => {
        return new Promise((resolve) => {
          expect(store.loading).toBe(true)
          resolve({ user: {}, session: {} } as any)
        })
      })

      // Act
      await store.signIn({ email: 'a@a.com', password: 'p' })

      // Assert
      expect(store.loading).toBe(false)
    })

    it('hasError deve refletir a presença de erro', () => {
      // Arrange & Act
      const store = useAuthStore()

      // Assert
      expect(store.hasError).toBe(false)
      store.error = 'Some error'
      expect(store.hasError).toBe(true)
    })

    it('isAuthenticated deve refletir a presença do usuário', () => {
      // Arrange & Act
      const store = useAuthStore()

      // Assert
      expect(store.isAuthenticated).toBe(false)
      store.user = { id: '1' } as any
      expect(store.isAuthenticated).toBe(true)
    })

    it('userEmail deve retornar o email do usuário ou vazio', () => {
      // Arrange & Act
      const store = useAuthStore()

      // Assert
      expect(store.userEmail).toBe('')
      store.user = { email: 'test@test.com' } as any
      expect(store.userEmail).toBe('test@test.com')
    })
  })
})
