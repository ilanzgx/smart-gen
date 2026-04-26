import { defineStore } from 'pinia'
import {
  signIn as signInFn,
  signUp as signUpFn,
  signOut as signOutFn,
  resetPasswordForEmail,
  updatePassword as updatePasswordFn,
  getSession,
  type User,
  type SignInCredentials,
  type SignUpCredentials,
  type AuthSession,
} from '@smart-gen/supabase'
import { translateAuthError } from '@smart-gen/shared'
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
      error.value = translateAuthError(
        err instanceof Error ? err.message : undefined,
        'Erro ao fazer login',
      )
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
      error.value = translateAuthError(
        err instanceof Error ? err.message : undefined,
        'Erro ao cadastrar',
      )
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
      error.value = translateAuthError(
        err instanceof Error ? err.message : undefined,
        'Erro ao sair',
      )
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

  /**
   * Envia email de redefinição de senha para o usuário
   * @param {string} email - Email do usuário
   * @param {string} redirectTo - URL para redirecionar após clique no email
   * @returns {Promise<void>}
   */
  async function recoverPassword(email: string, redirectTo: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await resetPasswordForEmail(supabase, email, redirectTo)
    } catch (err) {
      error.value = translateAuthError(
        err instanceof Error ? err.message : undefined,
        'Erro ao solicitar redefinição de senha',
      )
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Atualiza a senha do usuário
   * @param {string} password - Nova senha
   * @returns {Promise<void>}
   */
  async function updatePassword(password: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await updatePasswordFn(supabase, password)
    } catch (err) {
      error.value = translateAuthError(
        err instanceof Error ? err.message : undefined,
        'Erro ao atualizar senha',
      )
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Limpa o estado de erro atual
   */
  function clearError() {
    error.value = null
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
    recoverPassword,
    updatePassword,
    clearError,
  }
})
