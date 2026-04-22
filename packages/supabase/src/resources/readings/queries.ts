import type { SupabaseClient } from "@supabase/supabase-js";
import type { Leitura } from "./types";

/**
 * Retorna todas as leituras.
 * @param {SupabaseClient} supabase - Instância do Supabase.
 * @returns {Promise<Leitura[]>} - Dados de todas as leituras.
 */
export const getReadings = async (
  supabase: SupabaseClient
): Promise<Leitura[]> => {
  const { data, error } = await supabase.from("registro").select("*");

  if (error) throw error;

  return data as Leitura[];
};

/**
 * Retorna uma leitura pelo ID.
 * @param {SupabaseClient} supabase - Instância do Supabase.
 * @param {string} id - ID da leitura.
 * @returns {Promise<Leitura>} - Dados da leitura.
 */
export const getReadingById = async (
  supabase: SupabaseClient,
  id: string
): Promise<Leitura> => {
  const { data, error } = await supabase
    .from("registro")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as Leitura;
};

/**
 * Retorna todas as leituras de um gerador.
 * @param {SupabaseClient} supabase - Instância do Supabase.
 * @param {string} generatorId - ID do gerador.
 * @returns {Promise<Leitura[]>} - Dados de todas as leituras do gerador.
 */
export const getReadingsByGeneratorId = async (
  supabase: SupabaseClient,
  generatorId: string
): Promise<Leitura[]> => {
  const { data, error } = await supabase
    .from("registro")
    .select("*")
    .eq("gerador_id", generatorId);

  if (error) throw error;

  return data as Leitura[];
};

/**
 * Retorna a leitura mais recente de um gerador.
 * @param {SupabaseClient} supabase - Instância do Supabase.
 * @param {string} generatorId - ID do gerador.
 * @returns {Promise<Leitura>} - Dados da leitura mais recente do gerador.
 */
export const getLastReadingByGeneratorId = async (
  supabase: SupabaseClient,
  generatorId: string
): Promise<Leitura> => {
  const { data, error } = await supabase
    .from("registro")
    .select("*")
    .eq("gerador_id", generatorId)
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data as Leitura;
};
