"use client"

import { createClient } from "@supabase/supabase-js"

// Initialize the Supabase client at module scope
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single instance for the browser
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: "supabase-auth",
  },
})
