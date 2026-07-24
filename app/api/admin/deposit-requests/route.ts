import { NextRequest, NextResponse }  from "next/server"
import { adminGuard }                 from "@/lib/middleware/adminGuard"
import { getDepositRequests }         from "@/lib/services/deposit.service"

export async function GET(req: NextRequest) {
  const { error } = await adminGuard()
  if (error) return error

  const sp = req.nextUrl.searchParams

  const params = {
    page:            Math.max(1, Number(sp.get("page")  ?? 1)),
    limit:           Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20))),
    status:          sp.get("status")          ?? undefined,
    userId:          sp.get("userId")          ?? undefined,
    paymentMethodId: sp.get("paymentMethodId") ?? undefined,
    dateFrom:        sp.get("dateFrom")        ?? undefined,
    dateTo:          sp.get("dateTo")          ?? undefined,
    sortBy:          sp.get("sortBy")          ?? "createdAt",
    sortOrder:       (sp.get("sortOrder") ?? "desc") as "asc" | "desc",
    search:          sp.get("search")          ?? undefined,
  }

  try {
    const result = await getDepositRequests(params)
    return NextResponse.json(result)
  } catch (err) {
    console.error("[deposit-requests GET]", err)
    return NextResponse.json({ error: "Failed to fetch deposit requests" }, { status: 500 })
  }
}
