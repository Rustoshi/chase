import { NextRequest, NextResponse }  from "next/server"
import { adminGuard }                from "@/lib/middleware/adminGuard"
import { approveKycDocument }        from "@/lib/services/kyc.service"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error } = await adminGuard()
  if (error) return error

  try {
    const result = await approveKycDocument(id, user.id, user.email, req)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
