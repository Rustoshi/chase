"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import Link from "next/link"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Auth Error]", error)
  }, [error])

  return (
    <div className="text-center space-y-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center" style={{ backgroundColor: "var(--sh-error-bg)", borderRadius: "50%" }}>
        <AlertTriangle className="h-6 w-6" strokeWidth={1.5} style={{ color: "var(--sh-error)" }} />
      </div>
      <div>
        <h1 className="text-[1.75rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>Authentication error</h1>
        <p className="mt-3 text-[15px]" style={{ color: "var(--sh-ink-50)" }}>Something went wrong. Please try again.</p>
      </div>
      <div className="space-y-3">
        <button
          onClick={reset}
          className={`${LABEL} inline-flex items-center justify-center gap-2 h-12 w-full transition-colors`}
          style={{ color: "var(--sh-bronze-dark)", border: `0.5px solid ${BRONZE}`, borderRadius: "2px" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sh-bronze-10)" }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
        >
          <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
          Try again
        </button>
        <Link href="/login" className="block text-[14px]" style={{ color: "var(--sh-bronze-dark)", fontWeight: 500 }}>
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
