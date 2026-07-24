"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Loader2, AlertCircle, Lock, ShieldCheck } from "lucide-react"
import { BANK_NAME } from "@/lib/brand"

/* ══════════════════════════════════════════════════════════════════════════
   Admin sign-in — Safe Haven Private system (design.md): ink brand panel over
   a Pexels image, linen text, Newsreader display, General Sans UI, sharp 2px
   bronze-outline controls. Fully responsive.
   ══════════════════════════════════════════════════════════════════════════ */

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const loginSchema = z.object({
  email:    z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})
type LoginFormValues = z.infer<typeof loginSchema>

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "Invalid email or password. Please check your credentials and try again.",
  account_suspended:   "This account has been suspended. Contact your system administrator.",
  account_inactive:    "This account is inactive. Contact your system administrator.",
  not_admin:           "Access denied — this portal is for administrators only.",
  CredentialsSignin:   "Invalid email or password. Please try again.",
}
const FALLBACK_ERROR = "Something went wrong. Please try again later."

const FEATURES = [
  "Real-time transaction monitoring",
  "KYC review & compliance tools",
  "User management & access control",
]

function fieldBorder(focused: boolean, error: boolean) {
  return `0.5px solid ${error ? "var(--sh-error)" : focused ? BRONZE : "var(--sh-ink-10)"}`
}

export function AdminLoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError]       = useState<string | null>(null)
  const [focused, setFocused]           = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null)
    const result = await signIn("credentials", { redirect: false, email: data.email, password: data.password })
    if (result?.error) {
      setAuthError(AUTH_ERRORS[result.error] ?? FALLBACK_ERROR)
      return
    }
    if (result?.ok) {
      router.push("/admin/dashboard")
      router.refresh()
    }
  }

  return (
    <>
      {/* Safe Haven Private type system */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link href="https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&family=Spline+Sans+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div className="flex min-h-screen" style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI, color: INK }}>

        {/* ── Brand panel ── */}
        <div className="relative hidden lg:flex lg:w-[48%] flex-col overflow-hidden">
          <Image src="/images/stock/admin-brand.jpg" alt="" aria-hidden fill priority sizes="48vw" className="object-cover" />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(23,20,15,0.66)" }} />

          <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">
            {/* Logo */}
            <Link href="/" aria-label={BANK_NAME} className="inline-flex w-fit">
              <Image src="/images/logo.png" alt={BANK_NAME} width={256} height={128} className="h-7 w-auto" priority />
            </Link>

            {/* Headline */}
            <div className="flex-1 flex flex-col justify-center max-w-md">
              <div className="flex items-center gap-3">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-linen-70)" }}>Admin Portal</span>
              </div>
              <h1 className="mt-5 text-[2.5rem] xl:text-[3rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: "var(--sh-linen)" }}>
                Welcome back,
                <br />
                Administrator
              </h1>
              <p className="mt-6 text-[16px] leading-relaxed" style={{ color: "var(--sh-linen-70)" }}>
                Manage accounts, review transactions, approve deposits, and maintain full control of the {BANK_NAME} platform.
              </p>

              <ul className="mt-8 space-y-3">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[14px]" style={{ color: "var(--sh-linen-70)" }}>
                    <span aria-hidden style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: BRONZE }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--sh-linen-50)" }}>
              <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
              Secured with 256-bit TLS encryption
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="flex flex-1 flex-col min-h-screen">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between px-6 h-16" style={{ borderBottom: "0.5px solid var(--sh-ink-10)" }}>
            <Link href="/" aria-label={BANK_NAME} className="inline-flex">
              <Image src="/images/logo.png" alt={BANK_NAME} width={256} height={128} className="h-6 w-auto" />
            </Link>
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Admin Portal</span>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-16">
            <div className="w-full max-w-[420px]">
              <div className="space-y-8">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-3">
                    <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                    <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Administrators</span>
                  </div>
                  <h2 className="mt-4 text-[2rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>
                    Sign in
                  </h2>
                  <p className="mt-2 text-[15px]" style={{ color: "var(--sh-ink-50)" }}>
                    Enter your administrator credentials to continue
                  </p>
                </div>

                {authError && (
                  <div className="flex items-center gap-3 px-4 py-3.5" style={{ backgroundColor: "var(--sh-error-bg)", borderRadius: "2px" }}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} style={{ color: "var(--sh-error)" }} />
                    <p className="text-[14px]" style={{ color: "var(--sh-error)" }}>{authError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className={LABEL} style={{ color: focused === "email" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>
                      Email address
                    </label>
                    <input
                      id="email" type="email" autoComplete="email" autoFocus placeholder="admin@safehaven.io"
                      aria-invalid={!!errors.email}
                      {...register("email")}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      className="w-full h-12 px-4 text-[15px] focus:outline-none transition-colors placeholder:text-[#17140F80]"
                      style={{ backgroundColor: "var(--sh-surface)", border: fieldBorder(focused === "email", !!errors.email), borderRadius: "2px", color: INK }}
                    />
                    {errors.email && (
                      <p role="alert" className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}>
                        <AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label htmlFor="password" className={LABEL} style={{ color: focused === "password" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password"
                        aria-invalid={!!errors.password}
                        {...register("password")}
                        onFocus={() => setFocused("password")}
                        onBlur={() => setFocused(null)}
                        className="w-full h-12 px-4 pr-11 text-[15px] focus:outline-none transition-colors placeholder:text-[#17140F80]"
                        style={{ backgroundColor: "var(--sh-surface)", border: fieldBorder(focused === "password", !!errors.password), borderRadius: "2px", color: INK }}
                      />
                      <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--sh-ink-50)" }}>
                        {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p role="alert" className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}>
                        <AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.password.message}
                      </p>
                    )}
                  </div>

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

                <p className="flex items-center justify-center gap-2 text-center text-[12px]" style={{ color: "var(--sh-ink-50)" }}>
                  <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Protected area — unauthorised access is strictly prohibited
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
