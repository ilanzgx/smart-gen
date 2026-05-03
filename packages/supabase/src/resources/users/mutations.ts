import type { SupabaseClient } from "@supabase/supabase-js";
import type { UpdateUserDTO, UserProfile } from "./types";

/**
 * Faz alterações nos dados de um usuário pelo ID.
 * @param {SupabaseClient} supabase - Instância de SupabaseClient.
 * @param {string} id - ID do usuário a ser atualizado.
 * @param {UpdateUserDTO} data - Dados a serem atualizados.
 * @returns {Promise<UserProfile>} - Dados do usuário atualizado.
 */
export const updateUserById = async (
  supabase: SupabaseClient,
  id: string,
  data: UpdateUserDTO,
): Promise<UserProfile> => {
  const { data: updatedUser, error } = await supabase
    .from("usuario")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return updatedUser;
};
