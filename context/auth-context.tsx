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
  const router = useRouter()
  const supabase = getSupabaseBrowser()

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    // Initial session fetch
    const getInitialSession = async () => {
      setIsLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    }

    getInitialSession()

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
  }, [])

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!result.error && result.data.session) {
      router.push("/verify")
      router.refresh()
    }

    return result
  }

  const signUp = async (email: string, password: string) => {
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
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/verify`,
      },
    })
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
