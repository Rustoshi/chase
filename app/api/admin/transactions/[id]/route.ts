import { NextRequest, NextResponse }  from "next/server"
import { adminGuard }                from "@/lib/middleware/adminGuard"
import { getTransactionById }        from "@/lib/services/transaction.service"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await adminGuard()
  if (error) return error

  const { id } = await params

  try {
    const transaction = await getTransactionById(id)
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }
    return NextResponse.json({ transaction })
  } catch (err) {
    console.error("[admin/transactions/:id GET]", err)
    return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 })
  }
}
