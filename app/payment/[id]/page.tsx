"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getClientSupabase } from "@/lib/supabase"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"

export default function PaymentPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <PaymentForm debtId={params.id} />
    </ProtectedRoute>
  )
}

function PaymentForm({ debtId }: { debtId: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const [debt, setDebt] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getClientSupabase()

  useEffect(() => {
    async function fetchDebtData() {
      if (!user) return

      try {
        // Fetch debt data
        const { data, error } = await supabase.from("debt").select("*").eq("id", debtId).single()

        if (error) throw error

        setDebt(data)
        // Set default payment amount to the amount due
        setPaymentAmount(data.amount_due?.toString() || "0")
      } catch (error) {
        console.error("Error fetching debt data:", error)
        setError("Could not load debt information")
      } finally {
        setLoading(false)
      }
    }

    fetchDebtData()
  }, [debtId, user, supabase])

  const handlePaymentSuccess = async (details: any) => {
    try {
      // Record the payment in the database
      const { error } = await supabase.from("payments").insert({
        debt_id: debtId,
        amount: Number.parseFloat(paymentAmount),
        payment_method: "PayPal",
        transaction_id: details.id,
        status: "completed",
        notes: `Payment made via PayPal by ${user?.email}`,
        payment_date: new Date().toISOString(),
      })

      if (error) throw error

      // Update the debt balance
      const newBalance = debt.balance - Number.parseFloat(paymentAmount)
      const { error: updateError } = await supabase
        .from("debt")
        .update({
          balance: newBalance,
          last_payment_amount: Number.parseFloat(paymentAmount),
        })
        .eq("id", debtId)

      if (updateError) throw updateError

      setSuccess(`Payment of $${paymentAmount} was successful!`)

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    } catch (error) {
      console.error("Error recording payment:", error)
      setError("Payment was processed but there was an error updating your records")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!debt) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <p className="text-center">Debt information not found.</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Make a Payment</CardTitle>
          <CardDescription>
            Loan #{debt.loan_number} - Balance: ${debt.balance?.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Payment Amount ($)</Label>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              min="1"
              max={debt.balance}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="pt-4">
            <PayPalScriptProvider
              options={{
                "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
                currency: "USD",
              }}
            >
              <PayPalButtons
                style={{ layout: "vertical" }}
                disabled={!paymentAmount || Number.parseFloat(paymentAmount) <= 0}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    purchase_units: [
                      {
                        amount: {
                          value: paymentAmount,
                          currency_code: "USD",
                        },
                        description: `Payment for Loan #${debt.loan_number}`,
                      },
                    ],
                  })
                }}
                onApprove={(data, actions) => {
                  return actions.order!.capture().then((details) => {
                    handlePaymentSuccess(details)
                  })
                }}
              />
            </PayPalScriptProvider>
          </div>

          <div className="pt-4">
            <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
