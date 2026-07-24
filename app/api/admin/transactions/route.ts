import { NextRequest, NextResponse } from "next/server"
import { z }                        from "zod"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { getTransactions, createManualTransaction } from "@/lib/services/transaction.service"

export async function GET(req: NextRequest) {
  const { error } = await adminGuard()
  if (error) return error

  const sp = req.nextUrl.searchParams

  const params = {
    page:        Math.max(1,   Number(sp.get("page")  ?? 1)),
    limit:       Math.min(100, Math.max(1, Number(sp.get("limit") ?? 25))),
    search:      sp.get("search")      ?? undefined,
    userId:      sp.get("userId")      ?? undefined,
    accountId:   sp.get("accountId")   ?? undefined,
    type:        sp.get("type")        ?? undefined,
    status:      sp.get("status")      ?? undefined,
    dateFrom:    sp.get("dateFrom")    ?? undefined,
    dateTo:      sp.get("dateTo")      ?? undefined,
    amountMin:   sp.has("amountMin")   ? Number(sp.get("amountMin"))  : undefined,
    amountMax:   sp.has("amountMax")   ? Number(sp.get("amountMax"))  : undefined,
    currency:    sp.get("currency")    ?? undefined,
    isGenerated: sp.has("isGenerated") ? sp.get("isGenerated") === "true" : undefined,
    sortBy:      sp.get("sortBy")      ?? "createdAt",
    sortOrder:   (sp.get("sortOrder")  ?? "desc") as "asc" | "desc",
  }

  try {
    const result = await getTransactions(params)
    return NextResponse.json(result)
  } catch (err) {
    console.error("[admin/transactions GET]", err)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

const CreateSchema = z.object({
  accountId:   z.string().min(1),
  type:        z.enum(["admin_deposit", "withdrawal", "fee", "refund"]),
  amount:      z.number().positive("Amount must be positive"),
  currency:    z.string().min(1).max(10),
  description: z.string().min(1).max(500),
  reference:   z.string().min(1).max(50).optional(),
})

export async function POST(req: NextRequest) {
  const { user: admin, error } = await adminGuard()
  if (error) return error

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Validation failed" }, { status: 422 })
  }

  try {
    const tx = await createManualTransaction(parsed.data, admin.id, admin.email, req)
    return NextResponse.json({ transaction: tx }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create transaction"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
