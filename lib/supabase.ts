import { createClient } from "@supabase/supabase-js"

// Check for environment variables and provide fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Please check your .env file or Vercel environment variables.")
}

// Create a single supabase client for server-side
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
})

// Create a singleton instance for client-side
let clientInstance: ReturnType<typeof createClient> | null = null

export const getSupabaseBrowser = () => {
  if (typeof window === "undefined") {
    // Return a new instance for server-side rendering with appropriate error handling
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables are missing")
    }
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  if (!clientInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables are missing")
    }
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: "supabase-auth",
      },
    })
  }
  return clientInstance
}
