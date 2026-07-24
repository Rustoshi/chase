import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import crypto from "crypto"
import { connectDB } from "@/lib/db/connection"
import User from "@/lib/models/User"
import { sendWelcomeEmail } from "@/lib/email"

// ── Rate limiter (3 per email per hour) ───────────────────────────────────────

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

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 })
    }

    const email = parsed.data.email.toLowerCase().trim()

    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait before trying again." },
        { status: 429 }
      )
    }

    await connectDB()

    const user = await User.findOne({ email, emailVerified: false })

    if (user) {
      // Generate a fresh token
      const newToken = crypto.randomBytes(32).toString("hex")
      user.emailVerificationToken = newToken
      await user.save()
      await sendWelcomeEmail(user.email, user.firstName)
    }

    // Always return success — don't reveal whether email exists / is already verified
    return NextResponse.json({
      success: true,
      message: "If that email is registered and unverified, a new verification link has been sent.",
    })
  } catch {
    return NextResponse.json({
      success: true,
      message: "If that email is registered and unverified, a new verification link has been sent.",
    })
  }
}
