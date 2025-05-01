"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { supabaseBrowser } from "@/lib/supabase-browser"
import type { Debt } from "@/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js"

export default function Payment() {
  const { user } = useAuth()
  const [debts, setDebts] = useState<Debt[]>([])
  const [selectedDebtId, setSelectedDebtId] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Get verification data to find debtor_id
        const { data: verificationData, error: verificationError } = await supabaseBrowser
          .from("verification")
          .select("*")
          .eq("user_id", user.id)
          .eq("verified", true)
          .single()

        if (verificationError || !verificationData) {
          setError("Verification data not found")
          setIsLoading(false)
          return
        }

        const debtorId = verificationData.debtor_id

        // Get debts
        const { data: debtsData, error: debtsError } = await supabaseBrowser
          .from("debt")
          .select("*")
          .eq("debtor_id", debtorId)

        if (debtsError || !debtsData || debtsData.length === 0) {
          setError("No debt accounts found")
          setIsLoading(false)
          return
        }

        setDebts(debtsData)
        setSelectedDebtId(debtsData[0].id)
        setAmount(debtsData[0].amount_due.toString())
      } catch (err) {
        console.error("Error fetching debt information:", err)
        setError("An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleDebtChange = (value: string) => {
    setSelectedDebtId(value)
    const selectedDebt = debts.find((debt) => debt.id === value)
    if (selectedDebt) {
      setAmount(selectedDebt.amount_due.toString())
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setAmount(value)
    }
  }

  const createPayment = async (transactionId: string) => {
    try {
      const selectedDebt = debts.find((debt) => debt.id === selectedDebtId)
      if (!selectedDebt) return

      const paymentAmount = Number.parseFloat(amount)

      // Create payment record
      const { error: paymentError } = await supabaseBrowser.from("payments").insert({
        debt_id: selectedDebtId,
        amount: paymentAmount,
        payment_date: new Date().toISOString(),
        payment_method: "PayPal",
        transaction_id: transactionId,
        status: "completed",
        notes: "Payment made through portal",
      })

      if (paymentError) {
        console.error("Error creating payment record:", paymentError)
        return
      }

      // Update debt balance
      const newBalance = Number(selectedDebt.balance) - paymentAmount
      const { error: debtError } = await supabaseBrowser
        .from("debt")
        .update({
          balance: newBalance,
          last_payment_amount: paymentAmount,
        })
        .eq("id", selectedDebtId)

      if (debtError) {
        console.error("Error updating debt balance:", debtError)
        return
      }

      setPaymentSuccess(true)

      // Redirect to confirmation page
      router.push(`/confirmation?amount=${paymentAmount}&transaction=${transactionId}`)
    } catch (err) {
      console.error("Error processing payment:", err)
      setError("Failed to process payment")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading payment options...</h2>
          <p className="text-muted-foreground">Please wait while we prepare your payment form.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const selectedDebt = debts.find((debt) => debt.id === selectedDebtId)

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Make a Payment</CardTitle>
          <CardDescription>Select an account and enter the payment amount</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account">Select Account</Label>
            <Select value={selectedDebtId} onValueChange={handleDebtChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {debts.map((debt) => (
                  <SelectItem key={debt.id} value={debt.id}>
                    Loan #{debt.loan_number} - {debt.loan_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDebt && (
            <div className="space-y-2 border rounded-md p-3 bg-muted/20">
              <div className="flex justify-between">
                <span className="text-sm">Current Balance:</span>
                <span className="font-medium">{formatCurrency(selectedDebt.balance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Amount Due:</span>
                <span className="font-medium">{formatCurrency(selectedDebt.amount_due)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
              <Input id="amount" type="text" value={amount} onChange={handleAmountChange} className="pl-7" />
            </div>
          </div>

          <PayPalScriptProvider
            options={{
              "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
              currency: "USD",
            }}
          >
            <PayPalButtons
              style={{ layout: "vertical" }}
              createOrder={(data, actions) => {
                return actions.order.create({
                  purchase_units: [
                    {
                      amount: {
                        value: amount,
                      },
                    },
                  ],
                })
              }}
              onApprove={(data, actions) => {
                return actions.order!.capture().then((details) => {
                  const transactionId = details.id
                  createPayment(transactionId)
                })
              }}
              onError={(err) => {
                console.error("PayPal Error:", err)
                setError("Payment failed. Please try again.")
              }}
            />
          </PayPalScriptProvider>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">Payments are processed securely through PayPal</div>
        </CardFooter>
      </Card>
    </div>
  )
}
