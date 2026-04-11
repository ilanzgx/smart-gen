import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../database.types";

/*
 * Retorna todos os geradores ordenados por data de criação, do mais recente para o mais antigo.
 *
 * @param supabase - Instância de SupabaseClient.
 *
 * @returns Lista de geradores.
 */
export const getGenerators = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from("gerador")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data;
};

/*
 * Retorna um gerador específico pelo id, ordenado por data de criação.
 *
 * @param supabase - Instância de SupabaseClient.
 * @param id - Id do gerador.
 *
 * @returns Dados do gerador.
 */
export const getGeneratorById = async (
  supabase: SupabaseClient<Database>,
  id: string,
) => {
  const { data, error } = await supabase
    .from("gerador")
    .select("*")
    .eq("id", id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data;
};
