import type { SupabaseClient } from "@supabase/supabase-js";
import type { Leitura } from "./types";
import { TEMP_CRITICA, NIVEL_AGUA_CRITICO } from "@smart-gen/shared";

/**
 * Retorna todas as leituras.
 * @param {SupabaseClient} supabase - Instância do Supabase.
 * @returns {Promise<Leitura[]>} - Dados de todas as leituras.
 */
export const getReadings = async (
  supabase: SupabaseClient,
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
  id: string,
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
  generatorId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<Leitura[]> => {
  let query = supabase
    .from("registro")
    .select("*")
    .eq("gerador_id", generatorId);

  if (startDate) {
    query = query.gte("timestamp", startDate.toISOString());
  }

  if (endDate) {
    query = query.lte("timestamp", endDate.toISOString());
  }

  const { data, error } = await query;

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
  generatorId: string,
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

/**
 * Retorna leituras que violaram limiares críticos de operação.
 *
 * Filtra registros onde a temperatura atingiu ou ultrapassou TEMP_CRITICA (85°C)
 * e/ou o nível de água caiu para ou abaixo de NIVEL_AGUA_CRITICO (10%).
 *
 * @param {SupabaseClient} supabase - Instância do Supabase.
 * @param {object} [options] - Opções de filtragem.
 * @param {string} [options.generatorId] - Filtrar por gerador específico.
 * @param {Date} [options.startDate] - Data inicial do intervalo.
 * @param {Date} [options.endDate] - Data final do intervalo.
 * @param {number} [options.limit] - Limite de resultados (padrão: 50).
 * @returns {Promise<Leitura[]>} - Leituras que violaram limiares críticos, ordenadas por timestamp descendente.
 */
export const getCriticalReadings = async (
  supabase: SupabaseClient,
  options?: {
    generatorId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  },
): Promise<Leitura[]> => {
  let query = supabase
    .from("registro")
    .select("*")
    .or(`temperatura.gte.${TEMP_CRITICA},nivel_agua.lte.${NIVEL_AGUA_CRITICO}`)
    .order("timestamp", { ascending: false });

  if (options?.generatorId) {
    query = query.eq("gerador_id", options.generatorId);
  }

  if (options?.startDate) {
    query = query.gte("timestamp", options.startDate.toISOString());
  }

  if (options?.endDate) {
    query = query.lte("timestamp", options.endDate.toISOString());
  }

  query = query.limit(options?.limit ?? 50);

  const { data, error } = await query;

  if (error) throw error;

  return data as Leitura[];
};
