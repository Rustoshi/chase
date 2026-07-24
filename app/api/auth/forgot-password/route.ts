import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requestPasswordReset } from "@/lib/services/user-auth.service"
import { sendPasswordResetEmail } from "@/lib/email"

// ── Per-email rate limiter (3 attempts per email per hour) ────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT   = 3
const RATE_WINDOW  = 60 * 60 * 1000

function checkRateLimit(email: string): boolean {
  const key   = email.toLowerCase().trim()
  const now   = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ── Validation ────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
})

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      )
    }

    if (!checkRateLimit(parsed.data.email)) {
      // Still return the same generic message — don't reveal rate-limited
      return NextResponse.json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      })
    }

    const result = await requestPasswordReset(parsed.data.email)

    if (result) {
      await sendPasswordResetEmail(parsed.data.email, result.firstName, result.token)
    }

    // Always return the same response — never reveal whether email was found
    return NextResponse.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    })
  } catch {
    return NextResponse.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    })
  }
}
