import { createSupabaseInstance } from '@smart-gen/supabase'

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL
const supabaseKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('As variáveis de ambiente do Supabase não foram configuradas!')
}

export const supabase = createSupabaseInstance(supabaseUrl, supabaseKey)
