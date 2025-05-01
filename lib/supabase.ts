import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for server-side
export const supabaseServer = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
  auth: {
    persistSession: false,
  },
})

// Create a singleton instance for client-side
let clientInstance: ReturnType<typeof createClient> | null = null

export const getSupabaseBrowser = () => {
  if (typeof window === "undefined") {
    // Return a new instance for server-side rendering
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: "supabase-auth",
      },
    })
  }
  return clientInstance
}
