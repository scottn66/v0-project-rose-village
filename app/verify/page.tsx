"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowser } from "@/lib/supabase"

export default function VerifyIdentity() {
  const [loanNumber, setLoanNumber] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseBrowser()

  useEffect(() => {
    // Check if user is already verified
    const checkVerification = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("verification")
          .select("*")
          .eq("user_id", user.id)
          .eq("verified", true)
          .single()

        if (data && !error) {
          setIsVerified(true)
          router.push("/dashboard")
        }
      } catch (err) {
        console.error("Error checking verification:", err)
      }
    }

    checkVerification()
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // First, find the debtor with matching loan number and date of birth
      const { data: debtorData, error: debtorError } = await supabase
        .from("debtors")
        .select("*")
        .eq("loan_number", loanNumber)
        .eq("birthday", dateOfBirth)
        .single()

      if (debtorError || !debtorData) {
        setError("We could not verify your identity. Please check your information and try again.")
        setIsLoading(false)
        return
      }

      // Check if email matches (if provided)
      if (email && debtorData.email !== email) {
        setError("The email provided does not match our records.")
        setIsLoading(false)
        return
      }

      // Create or update verification record
      const { error: verificationError } = await supabase.from("verification").upsert({
        user_id: user.id,
        debtor_id: debtorData.id,
        verified: true,
        verification_date: new Date().toISOString(),
        verification_method: "identity_verification",
        updated_at: new Date().toISOString(),
      })

      if (verificationError) {
        setError("An error occurred while verifying your identity.")
        console.error("Verification error:", verificationError)
        setIsLoading(false)
        return
      }

      // Create or update user profile
      await supabase.from("user_profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: `${debtorData.first_name} ${debtorData.last_name}`,
        updated_at: new Date().toISOString(),
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Authentication Required</CardTitle>
            <CardDescription>Please sign in to verify your identity</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/auth/sign-in")} className="w-full">
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Verify Your Identity</CardTitle>
          <CardDescription>Please provide the following information to verify your identity</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loan-number">Loan Number</Label>
              <Input
                id="loan-number"
                type="text"
                value={loanNumber}
                onChange={(e) => setLoanNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-of-birth">Date of Birth</Label>
              <Input
                id="date-of-birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Identity"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Having trouble? Please contact our support team for assistance.
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
