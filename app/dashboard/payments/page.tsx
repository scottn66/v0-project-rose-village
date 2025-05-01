"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { supabaseBrowser } from "@/lib/supabase-browser"
import type { Payment, Debt } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function PaymentHistory() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [debts, setDebts] = useState<Record<string, Debt>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        if (debtsError || !debtsData) {
          setError("Error fetching debt information")
          setIsLoading(false)
          return
        }

        // Create a map of debt IDs to debt objects for easy lookup
        const debtsMap: Record<string, Debt> = {}
        debtsData.forEach((debt) => {
          debtsMap[debt.id] = debt
        })
        setDebts(debtsMap)

        // Get payments
        if (debtsData.length > 0) {
          const debtIds = debtsData.map((debt) => debt.id)

          const { data: paymentsData, error: paymentsError } = await supabaseBrowser
            .from("payments")
            .select("*")
            .in("debt_id", debtIds)
            .order("payment_date", { ascending: false })

          if (paymentsError) {
            setError("Error fetching payment history")
            setIsLoading(false)
            return
          }

          setPayments(paymentsData || [])
        }
      } catch (err) {
        console.error("Error fetching payment history:", err)
        setError("An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading payment history...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your payment details.</p>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
        <p className="text-muted-foreground">View all your past payments and transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>Complete history of your payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-muted-foreground">No payment history found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {debts[payment.debt_id] ? `Loan #${debts[payment.debt_id].loan_number}` : "Unknown"}
                    </TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <span className={payment.status === "completed" ? "text-green-500" : "text-amber-500"}>
                        {payment.status}
                      </span>
                    </TableCell>
                    <TableCell>{payment.transaction_id || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
