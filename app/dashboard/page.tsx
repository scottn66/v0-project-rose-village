"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { supabaseBrowser } from "@/lib/supabase-browser"
import type { Debt, Debtor, Payment } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { AlertCircle, ArrowRight, Calendar, DollarSign } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function Dashboard() {
  const { user } = useAuth()
  const [debts, setDebts] = useState<Debt[]>([])
  const [debtor, setDebtor] = useState<Debtor | null>(null)
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
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

        // Get debtor information
        const { data: debtorData, error: debtorError } = await supabaseBrowser
          .from("debtors")
          .select("*")
          .eq("id", debtorId)
          .single()

        if (debtorError || !debtorData) {
          setError("Debtor information not found")
          setIsLoading(false)
          return
        }

        setDebtor(debtorData)

        // Get debts
        const { data: debtsData, error: debtsError } = await supabaseBrowser
          .from("debt")
          .select("*")
          .eq("debtor_id", debtorId)

        if (debtsError) {
          setError("Error fetching debt information")
          setIsLoading(false)
          return
        }

        setDebts(debtsData || [])

        // Get recent payments
        if (debtsData && debtsData.length > 0) {
          const debtIds = debtsData.map((debt) => debt.id)

          const { data: paymentsData, error: paymentsError } = await supabaseBrowser
            .from("payments")
            .select("*")
            .in("debt_id", debtIds)
            .order("payment_date", { ascending: false })
            .limit(5)

          if (!paymentsError) {
            setRecentPayments(paymentsData || [])
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
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
          <h2 className="text-xl font-semibold mb-2">Loading your information...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your account details.</p>
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

  const totalBalance = debts.reduce((sum, debt) => sum + Number(debt.balance), 0)
  const totalDue = debts.reduce((sum, debt) => sum + Number(debt.amount_due), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {debtor?.first_name} {debtor?.last_name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Total amount across all accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDue)}</div>
            <p className="text-xs text-muted-foreground">Current amount due for payment</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Your Accounts</CardTitle>
            <CardDescription>Overview of your outstanding accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {debts.length === 0 ? (
              <p className="text-muted-foreground">No accounts found</p>
            ) : (
              <div className="space-y-4">
                {debts.map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">Loan #{debt.loan_number}</p>
                      <p className="text-sm text-muted-foreground">{debt.loan_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(debt.balance)}</p>
                      <p className="text-sm text-muted-foreground">Due: {formatCurrency(debt.amount_due)}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Link href="/payment">
                    <Button className="w-full">
                      Make a Payment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Your most recent payment activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-muted-foreground">No recent payments</p>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{payment.payment_method}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className={`text-sm ${payment.status === "completed" ? "text-green-500" : "text-amber-500"}`}>
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Link href="/dashboard/payments">
                    <Button variant="outline" className="w-full">
                      View All Payments
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
