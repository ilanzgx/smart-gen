import type {
  SignInCredentials,
  SignUpCredentials,
  AuthSession,
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
  supabase: SupabaseClient<Database>,
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
  supabase: SupabaseClient<Database>,
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
  supabase: SupabaseClient<Database>,
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
  supabase: SupabaseClient<Database>,
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
 * @returns {Promise<User | null>} Dados do usuário autenticado.
 */
export const getUser = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return data.user;
};
