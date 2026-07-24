"use client"

import { useState, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Mail, Lock } from "lucide-react"
import { BANK_NAME } from "@/lib/brand"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const loginSchema = z.object({
  email:    z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})
type LoginValues = z.infer<typeof loginSchema>

const AUTH_ERROR_MAP: Record<string, string> = {
  invalid_credentials:                             "Invalid email or password.",
  "Account suspended. Contact support.":           "Account suspended. Contact support.",
  "Account not found.":                            "Account not found.",
  "Please verify your email before signing in.":   "Please verify your email before signing in.",
  CredentialsSignin:                               "Invalid email or password.",
}

// Shared field helpers ────────────────────────────────────────────────────────
function fieldBorder(focused: boolean, error: boolean) {
  return `0.5px solid ${error ? "var(--sh-error)" : focused ? BRONZE : "var(--sh-ink-10)"}`
}
const inputBase = "w-full h-12 text-[16px] focus:outline-none transition-colors placeholder:text-[#17140F80]"

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-9 w-44 rounded" style={{ background: "var(--sh-ink-10)" }} />
        <div className="h-4 w-56 rounded" style={{ background: "var(--sh-ink-10)" }} />
      </div>
      <div className="space-y-5">
        <div className="h-12 rounded-[2px]" style={{ background: "var(--sh-ink-10)" }} />
        <div className="h-12 rounded-[2px]" style={{ background: "var(--sh-ink-10)" }} />
        <div className="h-12 rounded-[2px]" style={{ background: "var(--sh-ink-10)" }} />
      </div>
    </div>
  )
}

function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError]       = useState<string | null>(null)
  const [rememberMe, setRememberMe]     = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const verified    = searchParams.get("verified") === "true"
  const registered  = searchParams.get("registered") === "true"
  const errorParam  = searchParams.get("error")
  const callbackUrl = searchParams.get("callbackUrl")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const emailValue = watch("email")

  const onSubmit = async (data: LoginValues) => {
    setAuthError(null)
    const result = await signIn("credentials", {
      redirect: false,
      email:    data.email,
      password: data.password,
    })
    if (result?.error) {
      setAuthError(AUTH_ERROR_MAP[result.error] ?? "Something went wrong. Please try again.")
      return
    }
    if (result?.ok) {
      router.push(callbackUrl || "/app/dashboard")
      router.refresh()
    }
  }

  const isVerifyNotice = !!errorParam && errorParam.includes("verify")

  return (
    <>
      <title>{`Sign in — ${BANK_NAME}`}</title>

      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Members</span>
          </div>
          <h1 className="mt-4 text-[2rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>
            Welcome back
          </h1>
          <p className="mt-2 text-[15px]" style={{ color: "var(--sh-ink-50)" }}>
            Sign in to access your account
          </p>
        </div>

        {/* Success notice */}
        {(verified || registered) && (
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px" }}>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} style={{ color: BRONZE }} />
            <div>
              <p className="text-[14px]" style={{ fontWeight: 500, color: INK }}>
                {registered ? "Account created" : "Email verified"}
              </p>
              <p className="text-[12px]" style={{ color: "var(--sh-ink-50)" }}>You can now sign in to your account</p>
            </div>
          </div>
        )}

        {/* Verify-email notice (neutral, not an error) */}
        {isVerifyNotice && !verified && (
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-20)", borderRadius: "2px" }}>
            <Mail className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} style={{ color: BRONZE }} />
            <p className="text-[14px]" style={{ color: INK }}>{decodeURIComponent(errorParam!)}</p>
          </div>
        )}

        {/* Error notice from query param */}
        {errorParam && !verified && !isVerifyNotice && (
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ backgroundColor: "var(--sh-error-bg)", borderRadius: "2px" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} style={{ color: "var(--sh-error)" }} />
            <p className="text-[14px]" style={{ color: "var(--sh-error)" }}>{decodeURIComponent(errorParam)}</p>
          </div>
        )}

        {authError && (
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ backgroundColor: "var(--sh-error-bg)", borderRadius: "2px" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} style={{ color: "var(--sh-error)" }} />
            <p className="text-[14px]" style={{ color: "var(--sh-error)" }}>{authError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className={LABEL} style={{ color: focusedField === "email" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={1.5} style={{ color: focusedField === "email" ? BRONZE : "var(--sh-ink-50)" }} />
              <input
                id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com"
                aria-invalid={!!errors.email}
                {...register("email")}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className={`${inputBase} pl-11 pr-10`}
                style={{ backgroundColor: "var(--sh-surface)", border: fieldBorder(focusedField === "email", !!errors.email), borderRadius: "2px", color: INK }}
              />
              {emailValue && !errors.email && (
                <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={1.5} style={{ color: BRONZE }} />
              )}
            </div>
            {errors.email && (
              <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}>
                <AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className={LABEL} style={{ color: focusedField === "password" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>
                Password
              </label>
              <Link href="/forgot-password" className="text-[12px]" style={{ color: "var(--sh-bronze-dark)" }}>
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={1.5} style={{ color: focusedField === "password" ? BRONZE : "var(--sh-ink-50)" }} />
              <input
                id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password"
                aria-invalid={!!errors.password}
                {...register("password")}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className={`${inputBase} pl-11 pr-11`}
                style={{ backgroundColor: "var(--sh-surface)", border: fieldBorder(focusedField === "password", !!errors.password), borderRadius: "2px", color: INK }}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--sh-ink-50)" }}>
                {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}>
                <AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.password.message}
              </p>
            )}
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="relative flex items-center justify-center" style={{ width: 18, height: 18, border: `0.5px solid ${rememberMe ? BRONZE : "var(--sh-ink-20)"}`, backgroundColor: rememberMe ? "var(--sh-bronze-10)" : "transparent", borderRadius: "2px" }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only" />
              {rememberMe && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke={BRONZE} strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-[13px]" style={{ color: "var(--sh-ink-80)" }}>Keep me signed in for 30 days</span>
          </label>

          {/* Submit */}
          <button
            type="submit" disabled={isSubmitting}
            className={`${LABEL} w-full h-12 inline-flex items-center justify-center gap-2 transition-colors`}
            style={{ color: "var(--sh-bronze-dark)", border: `0.5px solid ${BRONZE}`, borderRadius: "2px", opacity: isSubmitting ? 0.6 : 1 }}
            onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "var(--sh-bronze-10)" }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
          >
            {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>) : "Sign in"}
          </button>
        </form>

        <p className="text-center text-[14px]" style={{ color: "var(--sh-ink-50)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "var(--sh-bronze-dark)", fontWeight: 500 }}>Create an account</Link>
        </p>
      </div>
    </>
  )
}
