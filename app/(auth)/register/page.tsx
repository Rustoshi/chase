"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Eye, EyeOff, Loader2, AlertCircle, Mail, XCircle,
  User, Phone, Lock, ArrowRight, ArrowLeft, CheckCircle2, Shield, Hash,
} from "lucide-react"
import { BANK_NAME } from "@/lib/brand"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const inputCls = "w-full h-12 text-[16px] focus:outline-none transition-colors placeholder:text-[#17140F80]"
const inputSt = (border: string) => ({ backgroundColor: "var(--sh-surface)", border, borderRadius: "2px", color: INK })

const registerSchema = z.object({
  firstName:       z.string().min(2, "At least 2 characters").max(50, "Max 50 characters"),
  lastName:        z.string().min(2, "At least 2 characters").max(50, "Max 50 characters"),
  email:           z.string().email("Enter a valid email address"),
  phone:           z.string().min(1, "Phone number is required").regex(/^[+]?[\d\s()-]{7,20}$/, "Enter a valid phone number"),
  currency:        z.string().min(3, "Select a currency").max(3, "Invalid currency code"),
  password:        z.string().min(8, "At least 8 characters"),
  confirmPassword: z.string(),
  pin:             z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d{4}$/, "PIN must contain only numbers"),
  confirmPin:      z.string(),
  agreeToTerms:    z.literal(true, { errorMap: () => ({ message: "You must agree to the Terms of Service" }) }),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] })
  .refine((d) => d.pin === d.confirmPin, { message: "PINs do not match", path: ["confirmPin"] })

type RegisterValues = z.infer<typeof registerSchema>

const STEPS = [
  { label: "Personal", icon: User },
  { label: "Security", icon: Shield },
  { label: "Verify",   icon: Mail },
]

function getPasswordStrength(pw: string): { score: number; label: string; color: string; tips: string[] } {
  let score = 0
  const tips: string[] = []
  if (pw.length >= 8) score++; else tips.push("At least 8 characters")
  if (/[A-Z]/.test(pw)) score++; else tips.push("One uppercase letter")
  if (/\d/.test(pw)) score++; else tips.push("One number")
  if (/[^a-zA-Z0-9]/.test(pw)) score++; else tips.push("One special character")

  const MAP: Record<number, { label: string; color: string }> = {
    0: { label: "",       color: "var(--sh-ink-10)" },
    1: { label: "Weak",   color: "var(--sh-ink-20)" },
    2: { label: "Fair",   color: "var(--sh-ink-50)" },
    3: { label: "Good",   color: "#A67C3D" },
    4: { label: "Strong", color: "#8A6428" },
  }
  return { score, tips, ...MAP[score] }
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8 overflow-x-auto scrollbar-hide">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const isActive = i === current
        const isCompleted = i < current
        const on = isActive || isCompleted
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div
                className="w-9 h-9 flex items-center justify-center"
                style={{ border: `0.5px solid ${on ? BRONZE : "var(--sh-ink-20)"}`, backgroundColor: on ? "var(--sh-bronze-10)" : "transparent", borderRadius: "2px" }}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} style={{ color: BRONZE }} />
                             : <Icon className="w-4 h-4" strokeWidth={1.5} style={{ color: on ? BRONZE : "var(--sh-ink-50)" }} />}
              </div>
              <span className={`${LABEL} whitespace-nowrap`} style={{ color: on ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 min-w-[2rem] mx-4" style={{ height: "0.5px", backgroundColor: isCompleted ? BRONZE : "var(--sh-ink-20)" }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep]                     = useState(0)
  const [showPassword, setShowPassword]     = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError]             = useState<string | null>(null)
  const [registrationDisabled, setRegistrationDisabled] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false)
  const [currencySearch, setCurrencySearch] = useState("")
  const currencyDropdownRef = useRef<HTMLDivElement>(null)

  // ── Email OTP verification (step 2) ──
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [otp, setOtp]           = useState("")
  const [otpError, setOtpError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendNote, setResendNote] = useState<string | null>(null)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/registration-status")
        if (res.ok) { const data = await res.json(); setRegistrationDisabled(!data.allowRegistration) }
      } catch { /* ignore */ }
      setCheckingStatus(false)
    })()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/public/settings")
        if (res.ok) {
          const data = await res.json()
          setSupportedCurrencies(data.supportedCurrencies || [
            "USD", "CAD", "MXN", "EUR", "GBP", "CHF", "SEK", "NOK", "DKK", "PLN",
            "CZK", "HUF", "RON", "BGN", "HRK", "JPY", "CNY", "INR", "AUD", "NZD",
            "SGD", "HKD", "KRW", "TWD", "THB", "IDR", "MYR", "PHP", "VND", "ILS",
            "AED", "SAR", "QAR", "KWD", "BHD", "OMR", "BRL", "ARS", "CLP", "COP",
            "PEN", "UYU", "PYG", "BOB", "ZAR", "EGP", "KES", "GHS", "TZS", "UGX",
            "ZMW", "BWP", "NAD", "MZN", "AOA", "RUB", "UAH", "KZT", "GEL", "AMD",
            "AZN", "TRY", "PKR", "BDT", "LKR", "NPR", "MUR", "JMD", "TTD", "BBD",
            "XCD", "BZD", "GTQ", "HNL", "NIO", "CRC", "PAB", "DOP", "CUP", "HTG",
            "XAF", "XOF", "XPF", "SCR", "SRD",
          ])
        }
      } catch { /* ignore */ }
      setLoadingCurrencies(false)
    })()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const {
    register, handleSubmit, trigger, watch, setValue, setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", currency: "USD", password: "", confirmPassword: "", pin: "", confirmPin: "" },
  })

  const password = watch("password")
  const confirmPassword = watch("confirmPassword")
  const pin = watch("pin")
  const confirmPin = watch("confirmPin")
  const strength = getPasswordStrength(password || "")
  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const pinsMatch = pin && confirmPin && pin === confirmPin

  const goToStep2 = useCallback(async () => {
    setApiError(null)
    const valid = await trigger(["firstName", "lastName", "email", "phone", "currency"])
    if (valid) setStep(1)
  }, [trigger])

  // Step 1 submit → send an OTP to the email; the account is created only once
  // the code is confirmed in step 2.
  const onSubmit = async (data: RegisterValues) => {
    setApiError(null)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 409) { setStep(0); setError("email", { message: "An account with this email already exists" }); return }
        if (res.status === 429) { setApiError("Too many attempts. Please wait before trying again."); return }
        if (json.errors) {
          for (const [field, msgs] of Object.entries(json.errors)) setError(field as keyof RegisterValues, { message: (msgs as string[])[0] })
          return
        }
        setApiError(json.error || "Something went wrong. Please try again."); return
      }
      // OTP sent — advance to the verify step.
      setRegisteredEmail(json.email || data.email)
      setOtp("")
      setOtpError(null)
      setResendNote(null)
      setResendCooldown(30)
      setStep(2)
    } catch {
      setApiError("Something went wrong. Please try again.")
    }
  }

  // Step 2 — confirm the OTP, which creates the account, then sign in.
  const handleVerify = async () => {
    if (otp.length !== 6 || verifying) return
    setOtpError(null)
    setVerifying(true)
    try {
      const res = await fetch("/api/auth/register/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, otp }),
      })
      const json = await res.json()
      if (!res.ok) {
        setOtpError(json.error || "Verification failed. Please try again.")
        setVerifying(false)
        return
      }
      // Account created — auto sign-in with the credentials still held in the form.
      const result = await signIn("credentials", { redirect: false, email: registeredEmail, password: watch("password") })
      if (result?.ok) router.push("/app/dashboard")
      else router.push("/login?registered=true")
    } catch {
      setOtpError("Something went wrong. Please try again.")
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setOtpError(null)
    setResendNote(null)
    try {
      const res = await fetch("/api/auth/register/resend-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      })
      if (res.status === 429) {
        const json = await res.json()
        setResendCooldown(30)
        setOtpError(json.error || "Please wait before requesting another code.")
        return
      }
      setResendNote("A new code is on its way to your inbox.")
      setResendCooldown(30)
    } catch {
      setOtpError("Could not resend the code. Please try again.")
    }
  }

  const bd = (name: string, error: boolean) => `0.5px solid ${error ? "var(--sh-error)" : focusedField === name ? BRONZE : "var(--sh-ink-10)"}`

  if (checkingStatus) {
    return (
      <>
        <title>{`Create account — ${BANK_NAME}`}</title>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" strokeWidth={1.5} style={{ color: BRONZE }} />
          <p className="mt-4 text-[14px]" style={{ color: "var(--sh-ink-50)" }}>Loading…</p>
        </div>
      </>
    )
  }

  if (registrationDisabled) {
    return (
      <>
        <title>{`Registration disabled — ${BANK_NAME}`}</title>
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center" style={{ backgroundColor: "var(--sh-error-bg)", borderRadius: "50%" }}>
            <XCircle className="h-8 w-8" strokeWidth={1.5} style={{ color: "var(--sh-error)" }} />
          </div>
          <div>
            <h1 className="text-[1.75rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>Registration disabled</h1>
            <p className="mt-3 text-[15px] max-w-sm mx-auto" style={{ color: "var(--sh-ink-50)" }}>New account registration is currently disabled. Please contact support for assistance.</p>
          </div>
          <Link href="/login" className={`${LABEL} inline-flex items-center justify-center h-12 px-8`} style={{ color: "var(--sh-bronze-dark)", border: `0.5px solid ${BRONZE}`, borderRadius: "2px" }}>
            Go to login
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <title>{`Create account — ${BANK_NAME}`}</title>

      <div className="space-y-6">
        <StepIndicator current={step} />

        {apiError && (
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ backgroundColor: "var(--sh-error-bg)", borderRadius: "2px" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} style={{ color: "var(--sh-error)" }} />
            <p className="text-[14px]" style={{ color: "var(--sh-error)" }}>{apiError}</p>
          </div>
        )}

        {/* STEP 1 — Personal */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-[2rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>Create your account</h1>
              <p className="mt-2 text-[15px]" style={{ color: "var(--sh-ink-50)" }}>Start banking with {BANK_NAME} in minutes</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 min-w-0">
                  <label htmlFor="firstName" className={LABEL} style={{ color: focusedField === "firstName" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>First name</label>
                  <input id="firstName" autoFocus placeholder="John" {...register("firstName")} onFocus={() => setFocusedField("firstName")} onBlur={() => setFocusedField(null)}
                    className={`${inputCls} px-4`} style={inputSt(bd("firstName", !!errors.firstName))} />
                  {errors.firstName && <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}><AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2 min-w-0">
                  <label htmlFor="lastName" className={LABEL} style={{ color: focusedField === "lastName" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>Last name</label>
                  <input id="lastName" placeholder="Doe" {...register("lastName")} onFocus={() => setFocusedField("lastName")} onBlur={() => setFocusedField(null)}
                    className={`${inputCls} px-4`} style={inputSt(bd("lastName", !!errors.lastName))} />
                  {errors.lastName && <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}><AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.lastName.message}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className={LABEL} style={{ color: focusedField === "email" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={1.5} style={{ color: focusedField === "email" ? BRONZE : "var(--sh-ink-50)" }} />
                  <input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                    className={`${inputCls} pl-11 pr-4`} style={inputSt(bd("email", !!errors.email))} />
                </div>
                {errors.email && <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}><AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className={LABEL} style={{ color: focusedField === "phone" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>Phone number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={1.5} style={{ color: focusedField === "phone" ? BRONZE : "var(--sh-ink-50)" }} />
                  <input id="phone" type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" {...register("phone")} onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)}
                    className={`${inputCls} pl-11 pr-4`} style={inputSt(bd("phone", !!errors.phone))} />
                </div>
                {errors.phone && <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}><AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.phone.message}</p>}
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <label htmlFor="currency" className={LABEL} style={{ color: focusedField === "currency" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>Preferred currency</label>
                <div className="relative" ref={currencyDropdownRef}>
                  {loadingCurrencies ? (
                    <div className="w-full h-12 px-4 flex items-center text-[15px]" style={inputSt("0.5px solid var(--sh-ink-10)")}><span style={{ color: "var(--sh-ink-50)" }}>Loading currencies…</span></div>
                  ) : (
                    <>
                      <div
                        onClick={() => { setShowCurrencyDropdown(!showCurrencyDropdown); setFocusedField("currency") }}
                        className="w-full h-12 px-4 cursor-pointer flex items-center justify-between text-[15px] transition-colors"
                        style={inputSt(bd("currency", !!errors.currency))}
                      >
                        <span style={{ color: watch("currency") ? INK : "var(--sh-ink-50)", fontFamily: MONO }}>{watch("currency") || "Select currency"}</span>
                        <Hash className="w-4 h-4" strokeWidth={1.5} style={{ color: focusedField === "currency" ? BRONZE : "var(--sh-ink-50)" }} />
                      </div>
                      {showCurrencyDropdown && (
                        <div className="absolute z-50 w-full mt-2 max-h-60 overflow-hidden flex flex-col" style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-20)", borderRadius: "2px" }}>
                          <div className="p-2" style={{ borderBottom: "0.5px solid var(--sh-ink-10)" }}>
                            <input
                              type="text" placeholder="Search…" value={currencySearch}
                              onChange={(e) => setCurrencySearch(e.target.value.toUpperCase())} onClick={(e) => e.stopPropagation()}
                              className="w-full h-9 px-3 text-[16px] focus:outline-none placeholder:text-[#17140F80]"
                              style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px", color: INK, fontFamily: MONO }}
                            />
                          </div>
                          <div className="overflow-y-auto max-h-48">
                            {supportedCurrencies.filter((c) => c.includes(currencySearch)).slice(0, 50).map((curr) => (
                              <div key={curr}
                                onClick={() => { setValue("currency", curr); setShowCurrencyDropdown(false); setCurrencySearch(""); setFocusedField(null) }}
                                className="px-4 py-2 text-[14px] cursor-pointer transition-colors"
                                style={{ color: INK, fontFamily: MONO }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sh-bronze-10)" }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                              >{curr}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {errors.currency && <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}><AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.currency.message}</p>}
              </div>

              <button type="button" onClick={goToStep2}
                className={`${LABEL} w-full h-12 inline-flex items-center justify-center gap-2 transition-colors`}
                style={{ color: "var(--sh-bronze-dark)", border: `0.5px solid ${BRONZE}`, borderRadius: "2px" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sh-bronze-10)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              >
                Continue <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <p className="text-center text-[14px]" style={{ color: "var(--sh-ink-50)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--sh-bronze-dark)", fontWeight: 500 }}>Sign in</Link>
            </p>
          </div>
        )}

        {/* STEP 2 — Security */}
        {step === 1 && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            <div>
              <h1 className="text-[2rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>Secure your account</h1>
              <p className="mt-2 text-[15px]" style={{ color: "var(--sh-ink-50)" }}>Choose a strong password to protect your funds</p>
            </div>

            <div className="space-y-4">
              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className={LABEL} style={{ color: focusedField === "password" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={1.5} style={{ color: focusedField === "password" ? BRONZE : "var(--sh-ink-50)" }} />
                  <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Create a strong password" {...register("password")} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
                    className={`${inputCls} pl-11 pr-11`} style={inputSt(bd("password", !!errors.password))} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--sh-ink-50)" }}>
                    {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>
                {errors.password && <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}><AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.password.message}</p>}

                {password && (
                  <div className="space-y-3 p-4" style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: "var(--sh-ink-50)" }}>Password strength</span>
                      <span className="text-[11px]" style={{ color: strength.color, fontWeight: 500 }}>{strength.label}</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((seg) => (
                        <div key={seg} className="h-1 flex-1 transition-colors" style={{ background: seg <= strength.score ? strength.color : "var(--sh-ink-10)" }} />
                      ))}
                    </div>
                    {strength.tips.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {strength.tips.map((tip, i) => (
                          <span key={i} className="text-[11px] px-2 py-1" style={{ color: "var(--sh-ink-50)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px" }}>{tip}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className={LABEL} style={{ color: focusedField === "confirmPassword" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={1.5} style={{ color: focusedField === "confirmPassword" ? BRONZE : "var(--sh-ink-50)" }} />
                  <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter your password" {...register("confirmPassword")} onFocus={() => setFocusedField("confirmPassword")} onBlur={() => setFocusedField(null)}
                    className={`${inputCls} pl-11 pr-16`} style={inputSt(`0.5px solid ${errors.confirmPassword ? "var(--sh-error)" : passwordsMatch ? BRONZE : focusedField === "confirmPassword" ? BRONZE : "var(--sh-ink-10)"}`)} />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--sh-ink-50)" }}>
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                  {passwordsMatch && <CheckCircle2 className="absolute right-11 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={1.5} style={{ color: BRONZE }} />}
                </div>
                {errors.confirmPassword && <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}><AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.confirmPassword.message}</p>}
              </div>

              {/* PIN */}
              <div className="pt-4" style={{ borderTop: "0.5px solid var(--sh-ink-10)" }}>
                <div className="flex items-center gap-2.5 mb-4">
                  <Hash className="w-4 h-4" strokeWidth={1.5} style={{ color: BRONZE }} />
                  <div>
                    <p className="text-[14px]" style={{ fontWeight: 500, color: INK }}>Transaction PIN</p>
                    <p className="text-[12px]" style={{ color: "var(--sh-ink-50)" }}>4-digit PIN for authorizing transactions</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 min-w-0">
                    <label htmlFor="pin" className={LABEL} style={{ color: focusedField === "pin" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>PIN</label>
                    <input id="pin" type="password" inputMode="numeric" maxLength={4} placeholder="••••" {...register("pin")} onFocus={() => setFocusedField("pin")} onBlur={() => setFocusedField(null)}
                      className="w-full h-12 px-4 text-center text-xl tracking-[0.5em] focus:outline-none transition-colors placeholder:text-[#17140F80]"
                      style={{ ...inputSt(bd("pin", !!errors.pin)), fontFamily: MONO }} />
                    {errors.pin && <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}><AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.pin.message}</p>}
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label htmlFor="confirmPin" className={LABEL} style={{ color: focusedField === "confirmPin" ? "var(--sh-bronze-dark)" : "var(--sh-ink-50)" }}>Confirm PIN</label>
                    <div className="relative">
                      <input id="confirmPin" type="password" inputMode="numeric" maxLength={4} placeholder="••••" {...register("confirmPin")} onFocus={() => setFocusedField("confirmPin")} onBlur={() => setFocusedField(null)}
                        className="w-full h-12 px-4 text-center text-xl tracking-[0.5em] focus:outline-none transition-colors placeholder:text-[#17140F80]"
                        style={{ ...inputSt(`0.5px solid ${errors.confirmPin ? "var(--sh-error)" : pinsMatch ? BRONZE : focusedField === "confirmPin" ? BRONZE : "var(--sh-ink-10)"}`), fontFamily: MONO }} />
                      {pinsMatch && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={1.5} style={{ color: BRONZE }} />}
                    </div>
                    {errors.confirmPin && <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}><AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.confirmPin.message}</p>}
                  </div>
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer p-4 transition-colors" style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px" }}>
                <span className="relative flex items-center justify-center mt-0.5 flex-shrink-0" style={{ width: 18, height: 18, border: `0.5px solid ${watch("agreeToTerms") ? BRONZE : "var(--sh-ink-20)"}`, backgroundColor: watch("agreeToTerms") ? "var(--sh-bronze-10)" : "transparent", borderRadius: "2px" }}>
                  <input type="checkbox" {...register("agreeToTerms")} className="sr-only peer" />
                  <svg className="w-3 h-3 opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke={BRONZE} strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                <span className="text-[13px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
                  I agree to the <Link href="/terms" style={{ color: "var(--sh-bronze-dark)" }}>Terms of Service</Link> and <Link href="/privacy" style={{ color: "var(--sh-bronze-dark)" }}>Privacy Policy</Link>
                </span>
              </label>
              {errors.agreeToTerms && <p className="text-[12px] flex items-center gap-1" style={{ color: "var(--sh-error)" }}><AlertCircle className="w-3 h-3" strokeWidth={1.5} />{errors.agreeToTerms.message}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(0)}
                  className="h-12 flex-1 inline-flex items-center justify-center gap-2 text-[14px] transition-colors"
                  style={{ border: "0.5px solid var(--sh-ink-20)", color: INK, borderRadius: "2px" }}>
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back
                </button>
                <button type="submit" disabled={isSubmitting}
                  className={`${LABEL} h-12 flex-[2] inline-flex items-center justify-center gap-2 transition-colors`}
                  style={{ color: "var(--sh-bronze-dark)", border: `0.5px solid ${BRONZE}`, borderRadius: "2px", opacity: isSubmitting ? 0.6 : 1 }}
                  onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "var(--sh-bronze-10)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                >
                  {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending code…</>) : "Create account"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 3 — Verify email */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-[2rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>Verify your email</h1>
              <p className="mt-2 text-[15px]" style={{ color: "var(--sh-ink-50)" }}>
                We sent a 6-digit code to <span style={{ color: INK }}>{registeredEmail}</span>. Enter it below to finish creating your account.
              </p>
            </div>

            {otpError && (
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ backgroundColor: "var(--sh-error-bg)", borderRadius: "2px" }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} style={{ color: "var(--sh-error)" }} />
                <p className="text-[14px]" style={{ color: "var(--sh-error)" }}>{otpError}</p>
              </div>
            )}
            {resendNote && !otpError && (
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px" }}>
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} style={{ color: BRONZE }} />
                <p className="text-[14px]" style={{ color: INK }}>{resendNote}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="otp" className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Verification code</label>
              <input
                id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} placeholder="••••••"
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(null) }}
                onKeyDown={(e) => { if (e.key === "Enter") handleVerify() }}
                className="w-full h-14 px-4 text-center text-2xl tracking-[0.5em] focus:outline-none transition-colors placeholder:text-[#17140F80]"
                style={{ ...inputSt(`0.5px solid ${otpError ? "var(--sh-error)" : BRONZE}`), fontFamily: MONO }}
              />
            </div>

            <button
              type="button" onClick={handleVerify} disabled={otp.length !== 6 || verifying}
              className={`${LABEL} w-full h-12 inline-flex items-center justify-center gap-2 transition-colors`}
              style={{ color: "var(--sh-bronze-dark)", border: `0.5px solid ${BRONZE}`, borderRadius: "2px", opacity: (otp.length !== 6 || verifying) ? 0.5 : 1 }}
              onMouseEnter={(e) => { if (otp.length === 6 && !verifying) e.currentTarget.style.backgroundColor = "var(--sh-bronze-10)" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            >
              {verifying ? (<><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>) : "Verify & create account"}
            </button>

            <div className="flex items-center justify-between text-[13px]">
              <button type="button" onClick={() => { setStep(1); setOtp(""); setOtpError(null) }} className="inline-flex items-center gap-1.5" style={{ color: "var(--sh-ink-50)" }}>
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} /> Edit details
              </button>
              {resendCooldown > 0 ? (
                <span style={{ color: "var(--sh-ink-50)" }}>Resend code in {resendCooldown}s</span>
              ) : (
                <button type="button" onClick={handleResend} style={{ color: "var(--sh-bronze-dark)", fontWeight: 500 }}>Resend code</button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
