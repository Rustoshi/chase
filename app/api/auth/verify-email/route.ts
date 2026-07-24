import { NextRequest, NextResponse } from "next/server"
import { verifyEmail } from "@/lib/services/user-auth.service"
import { sendEmailVerifiedEmail } from "@/lib/email"

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=InvalidToken", req.url))
    }

    const user = await verifyEmail(token)

    // Send confirmation email (non-blocking)
    await sendEmailVerifiedEmail(user.email, user.firstName)

    return NextResponse.redirect(new URL("/login?verified=true", req.url))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed"
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, req.url)
    )
  }
}
