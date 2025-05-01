import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Get environment variables with fallbacks
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  // Check if environment variables are available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in middleware")
    return res
  }

  // Create a Supabase client specifically for the middleware
  const supabase = createMiddlewareClient(
    { req, res },
    {
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    },
  )

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check auth status for protected routes
    const isAuthRoute = req.nextUrl.pathname.startsWith("/auth")
    const isProtectedRoute =
      req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/payment") ||
      req.nextUrl.pathname.startsWith("/confirmation")

    // If accessing auth routes while logged in, redirect to dashboard
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // If accessing protected routes while not logged in, redirect to login
    if (isProtectedRoute && !session) {
      return NextResponse.redirect(new URL("/auth/sign-in", req.url))
    }

    // If accessing verification page while not logged in, redirect to login
    if (req.nextUrl.pathname === "/verify" && !session) {
      return NextResponse.redirect(new URL("/auth/sign-in", req.url))
    }
  } catch (error) {
    console.error("Error in middleware:", error)
  }

  return res
}

export const config = {
  matcher: ["/dashboard/:path*", "/payment/:path*", "/confirmation/:path*", "/auth/:path*", "/verify"],
}
