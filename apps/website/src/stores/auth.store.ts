import { defineStore } from 'pinia'
import {
  signIn as signInFn,
  signUp as signUpFn,
  signOut as signOutFn,
  getSession,
  type User,
  type SignInCredentials,
  type SignUpCredentials,
  type AuthSession,
} from '@smart-gen/supabase'
import { supabase } from '@/lib/supabase'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<AuthSession | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email ?? '')
  const hasError = computed(() => !!error.value)

  /**
   * Faz login com as credenciais fornecidas
   * E em seguida inicia a sessão
   * @param {SignInCredentials} credentials - Credenciais de login
   * @returns {Promise<void>}
   */
  async function signIn(credentials: SignInCredentials): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = await signInFn(supabase, credentials)

      user.value = data.user
      session.value = data.session
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao fazer login'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Cadastra um novo usuário no Supabase
   * E em seguida inicia a sessão
   * @param credentials - Credenciais de cadastro
   * @returns {Promise<void>}
   */
  async function signUp(credentials: SignUpCredentials): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = await signUpFn(supabase, credentials)
      user.value = data.user
      session.value = data.session
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao cadastrar'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Desloga o usuário, excluindo a sessão do Supabase
   * @returns {Promise<void>}
   */
  async function signOut(): Promise<void> {
    loading.value = true

    try {
      await signOutFn(supabase)
      user.value = null
      session.value = null
      error.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao sair'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Cria um listener para o estado de autenticação do Supabase
   * @returns {Promise<() => void>} Retorna uma função para desinscrever do listener
   */
  async function initializeAuth(): Promise<() => void> {
    let unsubscribe: (() => void) | null = null

    try {
      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null
      })
      unsubscribe = data.subscription.unsubscribe

      const sessionData = await getSession(supabase)

      if (sessionData) {
        session.value = sessionData
        user.value = sessionData.user
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao inicializar autenticação'
    }

    return unsubscribe ?? (() => {})
  }

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated,
    userEmail,
    hasError,
    signIn,
    signUp,
    signOut,
    initializeAuth,
  }
})
