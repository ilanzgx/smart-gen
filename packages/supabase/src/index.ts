export { createSupabaseInstance } from "./client";
export type { SupabaseClient, User, Session } from "@supabase/supabase-js";
export type { Database } from "./database.types";

export * from "./resources/generators";
export * from "./resources/auth";
export * from "./resources/readings";
export * from "./resources/users";
