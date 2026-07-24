"use client"

import { useState, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { BANK_NAME } from "@/lib/brand"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"
const inputStyle = (border: string) => ({ backgroundColor: "var(--sh-surface)", border, borderRadius: "2px", color: INK })

const schema = z.object({
  password:        z.string().min(8, "At least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path:    ["confirmPassword"],
})
type FormValues = z.infer<typeof schema>

function getPasswordStrength(pw: string) {
  let score = 0
  if (pw.length >= 8)          score++
  if (/[A-Z]/.test(pw))        score++
  if (/\d/.test(pw))           score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++

  const MAP: Record<number, { label: string; color: string }> = {
    0: { label: "",       color: "var(--sh-ink-10)" },
    1: { label: "Weak",   color: "var(--sh-ink-20)" },
    2: { label: "Fair",   color: "var(--sh-ink-50)" },
    3: { label: "Good",   color: "#A67C3D" },
    4: { label: "Strong", color: "#8A6428" },
  }
  return { score, ...MAP[score] }
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded" style={{ background: "var(--sh-ink-10)" }} />
      <div className="space-y-4">
        <div className="h-12 rounded-[2px]" style={{ background: "var(--sh-ink-10)" }} />
        <div className="h-12 rounded-[2px]" style={{ background: "var(--sh-ink-10)" }} />
        <div className="h-12 rounded-[2px]" style={{ background: "var(--sh-ink-10)" }} />
      </div>
    </div>
  )
}

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused]           = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)
  const [apiError, setApiError]         = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const password = watch("password")
  const strength = getPasswordStrength(password || "")

  if (!token) {
    return (
      <>
        <title>{`Reset password — ${BANK_NAME}`}</title>
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center" style={{ backgroundColor: "var(--sh-error-bg)", borderRadius: "50%" }}>
            <AlertCircle className="h-6 w-6" strokeWidth={1.5} style={{ color: "var(--sh-error)" }} />
          </div>
          <div>
            <h1 className="text-[1.75rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>Invalid reset link</h1>
            <p className="mt-3 text-[15px]" style={{ color: "var(--sh-ink-50)" }}>This link is invalid or has expired. Request a new one.</p>
          </div>
          <Link href="/forgot-password" className={`${LABEL} flex items-center justify-center w-full h-12`} style={{ color: "var(--sh-bronze-dark)", border: `0.5px solid ${BRONZE}`, borderRadius: "2px" }}>
            Request new reset link
          </Link>
        </div>
      </>
    )
  }

  if (success) {
    return (
      <>
        <title>{`Password reset — ${BANK_NAME}`}</title>
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center" style={{ border: `0.5px solid ${BRONZE}`, borderRadius: "50%" }}>
            <CheckCircle2 className="h-6 w-6" strokeWidth={1.5} style={{ color: BRONZE }} />
          </div>
          <div>
            <h1 className="text-[1.75rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>Password reset</h1>
            <p className="mt-3 text-[15px]" style={{ color: "var(--sh-ink-50)" }}>Your password has been updated. Sign in with your new password.</p>
          </div>
          <Link href="/login" className={`${LABEL} flex items-center justify-center w-full h-12`} style={{ color: "var(--sh-bronze-dark)", border: `0.5px solid ${BRONZE}`, borderRadius: "2px" }}>
            Sign in with new password
          </Link>
        </div>
      </>
    )
  }

  const onSubmit = async (data: FormValues) => {
    setApiError(null)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password: data.password, confirmPassword: data.confirmPassword }),
      })
      const json = await res.json()
      if (!res.ok) {
        setApiError(json.error || "Reset failed. Please try again.")
        return
      }
      setSuccess(true)
    } catch {
      setApiError("Something went wrong. Please try again.")
    }
  }

  const border = (name: string, error: boolean) =>
    `0.5px solid ${error ? "var(--sh-error)" : focused === name ? BRONZE : "var(--sh-ink-10)"}`

  return (
    <>
      <title>{`Reset password — ${BANK_NAME}`}</title>
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Account recovery</span>
          </div>
          <h1 className="mt-4 text-[2rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>Set a new password</h1>
          <p className="mt-2 text-[15px]" style={{ color: "var(--sh-ink-50)" }}>Choose a strong password for your account.</p>
        </div>

        {apiError && (
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ backgroundColor: "var(--sh-error-bg)", borderRadius: "2px" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} style={{ color: "var(--sh-error)" }} />
            <p className="text-[14px]" style={{ color: "var(--sh-error)" }}>{apiError}</p>
            {apiError.includes("expired") && (
              <Link href="/forgot-password" className="ml-auto text-[12px]" style={{ color: "var(--sh-error)", fontWeight: 500 }}>Request new link</Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* New password */}
          <div className="space-y-2">
            <label htmlFor="password" className={LABEL} style={{ color: focused === "password" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>New password</label>
            <div className="relative">
              <input
                id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" autoFocus placeholder="Min. 8 characters"
                {...register("password")}
                onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                className="w-full h-12 px-4 pr-11 text-[15px] focus:outline-none transition-colors placeholder:text-[#17140F80]"
                style={inputStyle(border("password", !!errors.password))}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--sh-ink-50)" }}>
                {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}><AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.password.message}</p>
            )}
            {password && (
              <div className="pt-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((seg) => (
                    <div key={seg} className="h-1 flex-1 transition-colors" style={{ background: seg <= strength.score ? strength.color : "var(--sh-ink-10)" }} />
                  ))}
                </div>
                {strength.label && <p className="mt-1.5 text-[11px]" style={{ color: strength.color }}>{strength.label}</p>}
              </div>
            )}
          </div>

          {/* Confirm */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className={LABEL} style={{ color: focused === "confirmPassword" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>Confirm new password</label>
            <input
              id="confirmPassword" type="password" autoComplete="new-password" placeholder="Re-enter password"
              {...register("confirmPassword")}
              onFocus={() => setFocused("confirmPassword")} onBlur={() => setFocused(null)}
              className="w-full h-12 px-4 text-[15px] focus:outline-none transition-colors placeholder:text-[#17140F80]"
              style={inputStyle(border("confirmPassword", !!errors.confirmPassword))}
            />
            {errors.confirmPassword && (
              <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}><AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit" disabled={isSubmitting}
            className={`${LABEL} w-full h-12 inline-flex items-center justify-center gap-2 transition-colors`}
            style={{ color: "var(--sh-bronze-dark)", border: `0.5px solid ${BRONZE}`, borderRadius: "2px", opacity: isSubmitting ? 0.6 : 1 }}
            onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "var(--sh-bronze-10)" }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
          >
            {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</>) : "Reset password"}
          </button>
        </form>
      </div>
    </>
  )
}
