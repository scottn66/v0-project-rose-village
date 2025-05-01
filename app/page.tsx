import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EnvironmentCheck } from "@/components/env-check"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Debt Collection Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container py-12 md:py-24 lg:py-32">
          <EnvironmentCheck />
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Manage Your Payments Securely</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Our secure portal allows you to view your outstanding balances, payment history, and make payments online.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth/sign-up">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/auth/sign-in">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Debt Collection Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
