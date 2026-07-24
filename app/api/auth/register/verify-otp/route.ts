import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyRegistrationOtp } from "@/lib/services/user-auth.service"
import { sendWelcomeEmail } from "@/lib/email"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp:   z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter the 6-digit code we emailed you." }, { status: 400 })
    }

    const { user } = await verifyRegistrationOtp(parsed.data.email, parsed.data.otp)

    // Welcome email is best-effort — never blocks the response.
    await sendWelcomeEmail(user.email, user.firstName)

    return NextResponse.json({ success: true, message: "Email verified. Account created." }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed"

    if (message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 })
    }
    // Expired / too many attempts / incorrect code all surface as a 400 with a clear message.
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
