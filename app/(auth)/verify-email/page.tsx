"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, AlertCircle } from "lucide-react"
import { BANK_NAME } from "@/lib/brand"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

type Status = "loading" | "success" | "error"

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailSkeleton />}>
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailSkeleton() {
  return (
    <div className="text-center py-8">
      <Loader2 className="mx-auto h-9 w-9 animate-spin" strokeWidth={1.5} style={{ color: BRONZE }} />
      <p className="mt-4 text-[14px]" style={{ color: "var(--sh-ink-50)" }}>Loading…</p>
    </div>
  )
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus]     = useState<Status>(token ? "loading" : "error")
  const [errorMsg, setErrorMsg] = useState("Invalid verification link.")

  useEffect(() => {
    if (!token) return
    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`, { redirect: "manual" })
        if (res.type === "opaqueredirect" || res.ok || res.status === 302 || res.status === 308) {
          setStatus("success")
          return
        }
        setStatus("error")
        setErrorMsg("Verification failed. The link may have expired or already been used.")
      } catch {
        setStatus("success")
      }
    }
    verify()
  }, [token])

  return (
    <>
      <title>{`Verify email — ${BANK_NAME}`}</title>

      {status === "loading" && (
        <div className="text-center py-8">
          <Loader2 className="mx-auto h-9 w-9 animate-spin" strokeWidth={1.5} style={{ color: BRONZE }} />
          <p className="mt-4 text-[14px]" style={{ color: "var(--sh-ink-50)" }}>Verifying your email…</p>
        </div>
      )}

      {status === "success" && (
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center" style={{ border: `0.5px solid ${BRONZE}`, borderRadius: "50%" }}>
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke={BRONZE} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"
                style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: "checkDraw 0.4s ease-out 0.2s forwards" }} />
            </svg>
          </div>
          <div>
            <h1 className="text-[1.75rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>Email verified</h1>
            <p className="mt-3 text-[15px]" style={{ color: "var(--sh-ink-50)" }}>Your account is ready. Sign in to start banking.</p>
          </div>
          <Link href="/login" className={`${LABEL} flex items-center justify-center w-full h-12`} style={{ color: "var(--sh-bronze-dark)", border: `0.5px solid ${BRONZE}`, borderRadius: "2px" }}>
            Sign in to {BANK_NAME}
          </Link>
          <style>{`@keyframes checkDraw { to { stroke-dashoffset: 0; } }`}</style>
        </div>
      )}

      {status === "error" && (
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center" style={{ backgroundColor: "var(--sh-error-bg)", borderRadius: "50%" }}>
            <AlertCircle className="h-8 w-8" strokeWidth={1.5} style={{ color: "var(--sh-error)" }} />
          </div>
          <div>
            <h1 className="text-[1.75rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>Verification failed</h1>
            <p className="mt-3 text-[15px]" style={{ color: "var(--sh-ink-50)" }}>{errorMsg}</p>
          </div>
          <Link href="/forgot-password" className="flex items-center justify-center w-full h-12 text-[14px]" style={{ border: "0.5px solid var(--sh-ink-20)", color: INK, borderRadius: "2px" }}>
            Request a new verification email
          </Link>
        </div>
      )}
    </>
  )
}
