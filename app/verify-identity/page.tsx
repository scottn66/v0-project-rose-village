"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getClientSupabase } from "@/lib/supabase"

export default function VerifyIdentityPage() {
  return (
    <ProtectedRoute>
      <VerifyIdentityForm />
    </ProtectedRoute>
  )
}

function VerifyIdentityForm() {
  const router = useRouter()
  const { user } = useAuth()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [birthday, setBirthday] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = getClientSupabase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Query the database to verify identity
      const { data, error: queryError } = await supabase
        .from("debtors")
        .select("*")
        .eq("phone", phoneNumber)
        .eq("birthday", birthday)
        .single()

      if (queryError || !data) {
        setError("Identity verification failed. Please check your information and try again.")
        return
      }

      // Update the user's metadata with the debtor ID
      await supabase.auth.updateUser({
        data: { debtor_id: data.id, verified: true },
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Verify Your Identity</CardTitle>
          <CardDescription>Please provide your phone number and date of birth to verify your identity</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="555-123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday">Date of Birth</Label>
              <Input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify Identity"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
