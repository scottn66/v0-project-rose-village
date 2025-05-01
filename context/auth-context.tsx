"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    error: any | null
    data: any | null
  }>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{
    error: any | null
    data: any | null
  }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  let supabase: ReturnType<typeof getSupabaseBrowser>

  try {
    supabase = getSupabaseBrowser()
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err)
    setError(err instanceof Error ? err : new Error(String(err)))
    setIsLoading(false)
  }

  useEffect(() => {
    if (!supabase) return

    // Initial session fetch
    const getInitialSession = async () => {
      try {
        setIsLoading(true)
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
      } catch (err) {
        console.error("Error getting session:", err)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    try {
      // Set up the auth state change listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (err) {
      console.error("Error setting up auth state change listener:", err)
      setIsLoading(false)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error("Supabase client not initialized"), data: null }

    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!result.error && result.data.session) {
        router.push("/verify")
        router.refresh()
      }

      return result
    } catch (err) {
      console.error("Error signing in:", err)
      return { error: err, data: null }
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: new Error("Supabase client not initialized"), data: null }

    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      })

      if (!result.error) {
        router.push("/verify")
        router.refresh()
      }

      return result
    } catch (err) {
      console.error("Error signing up:", err)
      return { error: err, data: null }
    }
  }

  const signOut = async () => {
    if (!supabase) return

    try {
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (err) {
      console.error("Error signing out:", err)
    }
  }

  const signInWithGoogle = async () => {
    if (!supabase) return

    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/verify`,
        },
      })
    } catch (err) {
      console.error("Error signing in with Google:", err)
    }
  }

  // If there's an error initializing the Supabase client, render an error message
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <h2 className="mb-2 text-lg font-semibold text-red-800">Authentication Error</h2>
          <p className="text-red-600">
            There was an error initializing the authentication system. Please check your environment variables and try
            again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
