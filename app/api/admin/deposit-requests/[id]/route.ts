import { NextRequest, NextResponse }    from "next/server"
import { adminGuard }                   from "@/lib/middleware/adminGuard"
import { getDepositRequestById }        from "@/lib/services/deposit.service"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await adminGuard()
  if (error) return error

  const { id } = await params

  try {
    const request = await getDepositRequestById(id)
    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ request })
  } catch (err) {
    console.error("[deposit-requests/[id] GET]", err)
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 })
  }
}
