"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getClientSupabase } from "@/lib/supabase"
import { format } from "date-fns"

type Debtor = {
  id: string
  first_name: string
  last_name: string
  address: string
  city: string
  state: string
  zip: number
  phone: string
  email: string
  loan_number: number
  account_number: number
  birthday: string
}

type Debt = {
  id: string
  debtor_id: string
  loan_number: number
  account_number: number
  loan_amount: number
  balance: number
  amount_due: number
  payment_amount: number
  date_loan_made: string
  date_first_payment: string
  date_contract_due: string
  loan_type: string
  loan_frequency: string
  apr: number
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}

function Dashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [debtor, setDebtor] = useState<Debtor | null>(null)
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getClientSupabase()

  useEffect(() => {
    async function fetchDebtorData() {
      if (!user) return

      try {
        // Get the debtor_id from user metadata
        const { data: userData } = await supabase.auth.getUser()
        const debtorId = userData.user?.user_metadata?.debtor_id

        if (!debtorId) {
          // If not verified, redirect to verification
          router.push("/verify-identity")
          return
        }

        // Fetch debtor data
        const { data: debtorData, error: debtorError } = await supabase
          .from("debtors")
          .select("*")
          .eq("id", debtorId)
          .single()

        if (debtorError) throw debtorError

        // Fetch debt data
        const { data: debtData, error: debtError } = await supabase.from("debt").select("*").eq("debtor_id", debtorId)

        if (debtError) throw debtError

        setDebtor(debtorData)
        setDebts(debtData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDebtorData()
  }, [user, router, supabase])

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth/sign-in")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      {debtor ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                  <dd>
                    {debtor.first_name} {debtor.last_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                  <dd>{debtor.email || user?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                  <dd>{debtor.phone || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                  <dd>
                    {debtor.address}
                    <br />
                    {debtor.city}, {debtor.state} {debtor.zip}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Loan Number</dt>
                  <dd>{debtor.loan_number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Account Number</dt>
                  <dd>{debtor.account_number}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Debt Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {debts && debts.length > 0 ? (
                <div className="space-y-4">
                  {debts.map((debt) => (
                    <div key={debt.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Loan #{debt.loan_number}</span>
                        <span className="font-bold text-red-500">
                          ${debt.balance?.toFixed(2) || debt.amount_due?.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Original Amount: ${debt.loan_amount?.toFixed(2)}</p>
                        <p>Amount Due: ${debt.amount_due?.toFixed(2)}</p>
                        <p>Payment Amount: ${debt.payment_amount?.toFixed(2)}</p>
                        <p>Loan Type: {debt.loan_type || "Standard"}</p>
                        <p>APR: {debt.apr?.toFixed(2)}%</p>
                        <p>
                          Due Date:{" "}
                          {debt.date_contract_due ? format(new Date(debt.date_contract_due), "MM/dd/yyyy") : "N/A"}
                        </p>
                      </div>
                      <Button className="w-full mt-4" onClick={() => router.push(`/payment/${debt.id}`)}>
                        Make Payment
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No debts found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center">No data available. Please verify your identity.</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => router.push("/verify-identity")}>Verify Identity</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
