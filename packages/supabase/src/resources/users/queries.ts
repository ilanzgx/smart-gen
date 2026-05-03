import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "./types";

/**
 * Retorna todos os usuários.
 * @param {SupabaseClient} supabase - Instância de SupabaseClient.
 * @returns {Promise<UserProfile[]>} - Dados dos usuários.
 */
export const getUsers = async (
  supabase: SupabaseClient,
): Promise<UserProfile[]> => {
  const { data, error } = await supabase.from("usuario").select("*");

  if (error) throw error;

  return data as UserProfile[];
};

/**
 * Retorna os dados de um usuário específico pelo ID.
 * @param {SupabaseClient} supabase - Instância de SupabaseClient.
 * @param {string} id - ID do usuário.
 * @returns {Promise<UserProfile>} - Dados do usuário.
 */
export const getUserById = async (
  supabase: SupabaseClient,
  id: string,
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from("usuario")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as UserProfile;
};

/**
 * Retorna os dados de um usuário específico pelo email.
 * @param {SupabaseClient} supabase - Instância de SupabaseClient.
 * @param {string} email - Email do usuário.
 * @returns {Promise<UserProfile>} - Dados do usuário.
 */
export const getUserByEmail = async (
  supabase: SupabaseClient,
  email: string,
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from("usuario")
    .select("*")
    .eq("email", email)
    .single();

  if (error) throw error;

  return data as UserProfile;
};
