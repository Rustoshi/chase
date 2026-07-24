import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import User from "@/lib/models/User"
import { sendAdminAlertEmail } from "@/lib/email"

const DOC_LABELS: Record<string, string> = {
  passport: "Passport", drivers_license: "Driver's license", national_id: "National ID",
  selfie: "Selfie", address_proof: "Address proof", utility_bill: "Utility bill",
}

const schema = z.object({
  docTypes: z.array(z.string()).min(1).max(10),
})

/**
 * Sends ONE admin summary email after a client finishes a KYC submission
 * (called once by the client after all documents have uploaded).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 200 })

    await connectDB()
    const user = await User.findById(session.user.id).select("firstName lastName email").lean() as
      { firstName?: string; lastName?: string; email?: string } | null

    const clientName = user ? `${user.firstName} ${user.lastName}` : (session.user.email || "A client")
    const docList = [...new Set(parsed.data.docTypes)]
      .map((t) => DOC_LABELS[t] || t.replace(/_/g, " "))
      .join(", ")

    sendAdminAlertEmail("New KYC submission", [
      { label: "Client",    value: clientName },
      { label: "Email",     value: user?.email || session.user.email || "—" },
      { label: "Documents", value: docList },
      { label: "Date",      value: new Date().toLocaleString() },
    ], "A client just submitted documents for KYC review.").catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[POST /api/user/kyc/notify-admin]", err)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
