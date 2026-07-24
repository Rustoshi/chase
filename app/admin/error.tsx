"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Admin Panel Error]", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        
        <h1 className="text-xl font-bold text-white mb-2">Admin Panel Error</h1>
        <p className="text-white/50 mb-6 text-sm">
          An error occurred in the admin panel. This has been logged.
        </p>

        {error.digest && (
          <p className="text-xs text-white/30 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
          
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-white/10 text-white/70 text-sm font-medium hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
