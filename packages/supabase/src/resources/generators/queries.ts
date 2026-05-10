import type { SupabaseClient } from "@supabase/supabase-js";
import type { Generator } from "./types";

/**
 * Retorna todos os geradores ordenados por data de criação, do mais recente para o mais antigo.
 * @param {SupabaseClient} supabase - Instância de SupabaseClient.
 * @returns {Promise<Generator[]>} Lista de geradores.
 */
export const getGenerators = async (
  supabase: SupabaseClient,
): Promise<Generator[]> => {
  const { data, error } = await supabase
    .from("gerador")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return data;
};

/**
 * Retorna um gerador específico pelo id, ordenado por data de criação.
 * @param {SupabaseClient} supabase - Instância de SupabaseClient.
 * @param {string} id - Id do gerador.
 * @returns {Promise<Generator>}  Dados do gerador.
 */
export const getGeneratorById = async (
  supabase: SupabaseClient,
  id: string,
): Promise<Generator> => {
  const { data, error } = await supabase
    .from("gerador")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  return data;
};
