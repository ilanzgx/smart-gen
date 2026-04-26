import type {
  SignInCredentials,
  SignUpCredentials,
  AuthSession,
  AuthUser,
} from "./types";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../database.types";

/**
 * Realiza login do usuário.
 * @param {SupabaseClient} supabase - Instância de SupabaseClient.
 * @param {SignInCredentials} credentials - Credenciais de login.
 * @returns Dados do login.
 */
export const signIn = async (
  supabase: SupabaseClient,
  credentials: SignInCredentials,
) => {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Realiza cadastro do usuário.
 * @param {SupabaseClient} supabase - Instância de SupabaseClient.
 * @param {SignUpCredentials} credentials - Credenciais de cadastro.
 * @returns {Promise<{ user: User, session: AuthSession}>} Dados do cadastro.
 */
export const signUp = async (
  supabase: SupabaseClient,
  credentials: SignUpCredentials,
) => {
  const { data, error } = await supabase.auth.signUp(credentials);

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Realiza logout do usuário.
 * @param {SupabaseClient} supabase - Instância de SupabaseClient.
 * @returns {Promise<void>}.
 */
export const signOut = async (
  supabase: SupabaseClient,
): Promise<void> => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  return;
};

/**
 * Retorna a sessão atual do usuário.
 * @param {SupabaseClient} supabase - Instância de SupabaseClient.
 * @returns {Promise<AuthSession | null>} Sessão atual do usuário.
 */
export const getSession = async (
  supabase: SupabaseClient,
): Promise<AuthSession | null> => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session ?? null;
};

/**
 * Retorna o usuário autenticado verificado pelo servidor Supabase.
 * Use esta função em vez de getSession quando precisar de dados confiáveis.
 * @param {SupabaseClient} supabase - Instância de SupabaseClient.
 * @returns {Promise<AuthUser>} Dados do usuário autenticado.
 */
export const getUser = async (
  supabase: SupabaseClient,
): Promise<AuthUser> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return data.user;
};

/**
 * Envia email de redefinição de senha para o usuário.
 * @param {SupabaseClient} supabase - Instância de SupabaseClient.
 * @param {string} email - Email do usuário.
 * @param {string} redirectTo - URL para redirecionar após o usuário clicar no link.
 * @returns {Promise<void>}
 */
export const resetPasswordForEmail = async (
  supabase: SupabaseClient,
  email: string,
  redirectTo: string,
): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw error;
  }
};

/**
 * Atualiza a senha do usuário autenticado.
 * @param {SupabaseClient} supabase - Instância de SupabaseClient.
 * @param {string} password - Nova senha.
 * @returns {Promise<void>}
 */
export const updatePassword = async (
  supabase: SupabaseClient,
  password: string,
): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }
};
