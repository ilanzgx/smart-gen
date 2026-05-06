import type { SupabaseClient } from "@supabase/supabase-js";
import type { Generator, GeneratorInsert, GeneratorUpdate } from "./types";

/**
 * Cria um novo gerador no banco de dados.
 * @param supabase - Instância de SupabaseClient.
 * @param data - Dados do gerador a serem inseridos.
 * @returns O gerador criado.
 */
export const createGenerator = async (
  supabase: SupabaseClient,
  data: GeneratorInsert,
): Promise<Generator> => {
  const { data: newGenerator, error } = await supabase
    .from("gerador")
    .insert(data)
    .select()
    .single();

  if (error) throw error;

  return newGenerator;
};

/**
 * Atualiza um gerador existente no banco de dados.
 * @param supabase - Instância de SupabaseClient.
 * @param id - ID do gerador a ser atualizado.
 * @param data - Dados do gerador a serem atualizados.
 * @returns O gerador atualizado.
 */
export const updateGeneratorById = async (
  supabase: SupabaseClient,
  id: string,
  data: GeneratorUpdate,
): Promise<Generator> => {
  const { data: updatedGenerator, error } = await supabase
    .from("gerador")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return updatedGenerator;
};

/**
 * Deleta um gerador existente no banco de dados.
 * @param supabase - Instância de SupabaseClient.
 * @param id - ID do gerador a ser deletado.
 */
export const deleteGeneratorById = async (
  supabase: SupabaseClient,
  id: string,
): Promise<void> => {
  const { error } = await supabase.from("gerador").delete().eq("id", id);

  if (error) throw error;

  return;
};
