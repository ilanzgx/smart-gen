import type { Database } from "../../database.types";

export type Generator = Database["public"]["Tables"]["gerador"]["Row"];
export type GeneratorInsert = Database["public"]["Tables"]["gerador"]["Insert"];
export type GeneratorUpdate = Database["public"]["Tables"]["gerador"]["Update"];
