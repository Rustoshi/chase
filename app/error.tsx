"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error("[Global Error]", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-white/50 mb-8">
          An unexpected error occurred. Our team has been notified.
        </p>

        {error.digest && (
          <p className="text-xs text-white/30 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#3B9EFF] text-white font-medium hover:bg-[#3B9EFF]/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-white/10 text-white/70 font-medium hover:bg-white/5 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
