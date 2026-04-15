import type {
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  Session,
  User,
} from "@supabase/supabase-js";

export type SignInCredentials = SignInWithPasswordCredentials;
export type SignUpCredentials = SignUpWithPasswordCredentials;
export type AuthSession = Session;
export type AuthUser = User;
