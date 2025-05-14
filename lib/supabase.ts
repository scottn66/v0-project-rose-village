import { createClient } from "@supabase/supabase-js"

// For client-side usage (with anon key)
export const createClientSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Singleton pattern for client-side to prevent multiple instances
let clientSupabase: ReturnType<typeof createClientSupabase> | null = null

export const getClientSupabase = () => {
  if (!clientSupabase) {
    clientSupabase = createClientSupabase()
  }
  return clientSupabase
}

// For server-side usage (with service role key)
export const createServerSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, supabaseServiceKey)
}
