"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function Confirmation() {
  const searchParams = useSearchParams()
  const [amount, setAmount] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [date, setDate] = useState<string>("")

  useEffect(() => {
    const amountParam = searchParams.get("amount")
    const transactionParam = searchParams.get("transaction")

    if (amountParam) {
      setAmount(amountParam)
    }

    if (transactionParam) {
      setTransactionId(transactionParam)
    }

    setDate(new Date().toLocaleDateString())
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Payment Successful!</CardTitle>
          <CardDescription>Your payment has been processed successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-md p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-medium">{amount ? formatCurrency(Number.parseFloat(amount)) : "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID:</span>
              <span className="font-medium">{transactionId || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-medium">PayPal</span>
            </div>
          </div>

          <div className="bg-muted/30 rounded-md p-4 text-center">
            <p className="text-sm">A receipt has been sent to your email address. Please keep this for your records.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/dashboard" className="w-full">
            <Button className="w-full">Return to Dashboard</Button>
          </Link>
          <Button variant="outline" className="w-full" onClick={() => window.print()}>
            Print Receipt
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
