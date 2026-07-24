import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { resendRegistrationOtp } from "@/lib/services/user-auth.service"
import { sendOtpEmail } from "@/lib/email"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 })
    }

    const result = await resendRegistrationOtp(parsed.data.email)

    // Respond the same way whether or not a pending signup exists — avoids
    // leaking which emails are mid-registration.
    if (result) {
      await sendOtpEmail(parsed.data.email, result.firstName, result.otp)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not resend the code."
    // Cooldown violations surface as 429.
    if (message.includes("wait a moment")) {
      return NextResponse.json({ error: message }, { status: 429 })
    }
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
