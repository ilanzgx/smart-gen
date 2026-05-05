import type { SupabaseClient } from "@supabase/supabase-js";
import type { Generator } from "./types";

export const createGenerator = async (
  supabase: SupabaseClient,
  data: Generator,
): Promise<Generator> => {
  const { data: newGenerator, error } = await supabase
    .from("gerador")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return newGenerator;
};

export const updateGeneratorById = async (
  supabase: SupabaseClient,
  id: string,
  data: Partial<Generator>,
): Promise<Generator> => {
  const { data: updatedGenerator, error } = await supabase
    .from("gerador")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return updatedGenerator;
};

export const deleteGeneratorById = async (
  supabase: SupabaseClient,
  id: string,
): Promise<void> => {
  const { error } = await supabase.from("gerador").delete().eq("id", id);

  if (error) throw new Error(error.message);

  return;
};
