import type {
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  Session,
} from "@supabase/supabase-js";

export type SignInCredentials = SignInWithPasswordCredentials;
export type SignUpCredentials = SignUpWithPasswordCredentials;
export type AuthSession = Session;
