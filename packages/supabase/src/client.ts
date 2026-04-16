import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cria uma instância do Supabase com a URL e a chave fornecidas.
 * @param {string} url - A URL do Supabase.
 * @param {string} key - A chave de acesso do Supabase, JAMAIS use o service key, apenas a chave anonima com segurança RLS
 * @returns {SupabaseClient} Uma instância do Supabase.
 */
export const createSupabaseInstance = (
  url: string,
  key: string,
): SupabaseClient => {
  if (!url || !key) {
    throw new Error("URL e chave do Supabase são obrigatórios");
  }

  return createClient(url, key);
};
