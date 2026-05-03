import type { Database } from "../../database.types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

//export type Usuario = Database["public"]["Tables"]["usuario"]["Row"] &
//  SupabaseUser;

export type UserProfile = Database["public"]["Tables"]["usuario"]["Row"];
export type FullUser = UserProfile & { auth: SupabaseUser };

export type UpdateUserDTO = {
  nome?: string;
};
