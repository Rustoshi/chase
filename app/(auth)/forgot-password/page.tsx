"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Loader2, Mail, AlertCircle } from "lucide-react"
import { BANK_NAME } from "@/lib/brand"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
})
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent]           = useState(false)
  const [sentEmail, setSentEmail] = useState("")
  const [focused, setFocused]     = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormValues) => {
    await fetch("/api/auth/forgot-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: data.email }),
    })
    setSentEmail(data.email)
    setSent(true)
  }

  const tryDifferent = () => {
    setSent(false)
    setSentEmail("")
    reset()
  }

  return (
    <>
      <title>{`Forgot password — ${BANK_NAME}`}</title>

      {!sent ? (
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Account recovery</span>
            </div>
            <h1 className="mt-4 text-[2rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>
              Forgot password?
            </h1>
            <p className="mt-2 text-[15px]" style={{ color: "var(--sh-ink-50)" }}>
              Enter your email and we&apos;ll send a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className={LABEL} style={{ color: focused ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={1.5} style={{ color: focused ? BRONZE : "var(--sh-ink-50)" }} />
                <input
                  id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com"
                  {...register("email")}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="w-full h-12 pl-11 pr-4 text-[15px] focus:outline-none transition-colors placeholder:text-[#17140F80]"
                  style={{ backgroundColor: "var(--sh-surface)", border: `0.5px solid ${errors.email ? "var(--sh-error)" : focused ? BRONZE : "var(--sh-ink-10)"}`, borderRadius: "2px", color: INK }}
                />
              </div>
              {errors.email && (
                <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}>
                  <AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit" disabled={isSubmitting}
              className={`${LABEL} w-full h-12 inline-flex items-center justify-center gap-2 transition-colors`}
              style={{ color: "var(--sh-bronze-dark)", border: `0.5px solid ${BRONZE}`, borderRadius: "2px", opacity: isSubmitting ? 0.6 : 1 }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "var(--sh-bronze-10)" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            >
              {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>) : "Send reset link"}
            </button>
          </form>

          <p className="text-center text-[14px]">
            <Link href="/login" style={{ color: "var(--sh-bronze-dark)", fontWeight: 500 }}>Back to sign in</Link>
          </p>
        </div>
      ) : (
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center" style={{ border: `0.5px solid ${BRONZE}`, borderRadius: "50%" }}>
            <Mail className="h-6 w-6" strokeWidth={1.5} style={{ color: BRONZE }} />
          </div>
          <div>
            <h1 className="text-[1.75rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>Check your email</h1>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-50)" }}>
              If <span style={{ color: INK }}>{sentEmail}</span> is registered, a reset link has been sent. Check your inbox.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/login"
              className="flex items-center justify-center w-full h-12 text-[14px] transition-colors"
              style={{ border: "0.5px solid var(--sh-ink-20)", color: INK, borderRadius: "2px" }}
            >
              Back to sign in
            </Link>
            <button type="button" onClick={tryDifferent} className="block w-full text-[13px]" style={{ color: "var(--sh-ink-50)" }}>
              Try a different email
            </button>
          </div>
        </div>
      )}
    </>
  )
}
