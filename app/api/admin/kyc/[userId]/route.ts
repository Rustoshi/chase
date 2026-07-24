import { NextResponse }          from "next/server"
import { adminGuard }            from "@/lib/middleware/adminGuard"
import { getKycDocumentsByUser } from "@/lib/services/kyc.service"

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { error } = await adminGuard()
  if (error) return error

  try {
    const { userId } = await params
    console.log("[KYC API] Fetching documents for userId:", userId)
    const detail = await getKycDocumentsByUser(userId)
    console.log("[KYC API] Found documents:", detail.documents.length)
    return NextResponse.json(detail)
  } catch (err) {
    console.error("[KYC API] Error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 404 })
  }
}
