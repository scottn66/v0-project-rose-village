"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { supabaseBrowser } from "@/lib/supabase-browser"
import type { UserProfile } from "@/types"
import { LogOut, User } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkVerification = async () => {
      if (!user) {
        router.push("/auth/sign-in")
        return
      }

      try {
        // Check if user is verified
        const { data: verificationData, error: verificationError } = await supabaseBrowser
          .from("verification")
          .select("*")
          .eq("user_id", user.id)
          .eq("verified", true)
          .single()

        if (verificationError || !verificationData) {
          router.push("/verify")
          return
        }

        setIsVerified(true)

        // Get user profile
        const { data: profileData, error: profileError } = await supabaseBrowser
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (!profileError && profileData) {
          setProfile(profileData)
        }
      } catch (err) {
        console.error("Error checking verification:", err)
        router.push("/verify")
      }
    }

    checkVerification()
  }, [user, router])

  if (!isVerified) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <h1 className="text-xl font-bold">Debt Collection Portal</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{profile?.full_name || user?.email}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-64 border-r bg-muted/40 hidden md:block">
          <nav className="flex flex-col gap-2 p-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/payments">
              <Button variant="ghost" className="w-full justify-start">
                Payment History
              </Button>
            </Link>
            <Link href="/payment">
              <Button variant="ghost" className="w-full justify-start">
                Make Payment
              </Button>
            </Link>
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
