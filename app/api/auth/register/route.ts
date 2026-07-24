import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { startEmailVerification } from "@/lib/services/user-auth.service"
import { sendOtpEmail } from "@/lib/email"
import { getAppSettings } from "@/lib/services/settings.service"

// ── In-memory rate limiter (IP-based, 5 registrations per hour) ───────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT   = 5
const RATE_WINDOW  = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): boolean {
  const now   = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ── Validation ────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  firstName:       z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName:        z.string().min(2, "Last name must be at least 2 characters").max(50),
  email:           z.string().email("Enter a valid email address"),
  password:        z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  pin:             z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d{4}$/, "PIN must contain only numbers"),
  confirmPin:      z.string(),
  phone:           z.string().min(1, "Phone number is required").regex(/^[+]?[\d\s()-]{7,20}$/, "Enter a valid phone number"),
  currency:        z.string().min(3, "Select a currency").max(3, "Invalid currency code"),
  agreeToTerms:    z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms of Service" }),
  }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path:    ["confirmPassword"],
}).refine((d) => d.pin === d.confirmPin, {
  message: "PINs do not match",
  path:    ["confirmPin"],
})

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Check if registration is allowed
    const settings = await getAppSettings()
    if (settings.allowRegistration === false) {
      return NextResponse.json(
        { error: "Registration is currently disabled. Please contact support." },
        { status: 403 }
      )
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
               ?? req.headers.get("x-real-ip")
               ?? "unknown"

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many registration attempts. Try again later." },
        { status: 429 }
      )
    }

    const body   = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 })
    }

    // Do NOT create the account yet — stash it and email a one-time code first.
    const { otp, firstName, email } = await startEmailVerification({
      firstName: parsed.data.firstName,
      lastName:  parsed.data.lastName,
      email:     parsed.data.email,
      password:  parsed.data.password,
      pin:       parsed.data.pin,
      phone:     parsed.data.phone,
      currency:  parsed.data.currency,
    })

    const sent = await sendOtpEmail(email, firstName, otp)
    if (!sent) {
      return NextResponse.json(
        { error: "We couldn't send your verification code. Please try again shortly." },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { success: true, requiresOtp: true, email },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed"

    // Map known service errors to appropriate status codes
    if (message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 })
    }

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
