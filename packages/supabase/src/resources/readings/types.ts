import type { Database } from "../../database.types";

export type Leitura = Database["public"]["Tables"]["registro"]["Row"];
export type LeituraInsert = Database["public"]["Tables"]["registro"]["Insert"];
