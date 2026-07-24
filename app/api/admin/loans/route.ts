import { NextRequest, NextResponse } from "next/server"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { getLoanApplications }      from "@/lib/services/loan.service"

export async function GET(req: NextRequest) {
  const { error } = await adminGuard()
  if (error) return error

  const sp = req.nextUrl.searchParams
  const result = await getLoanApplications({
    page:      Number(sp.get("page")  ?? 1),
    limit:     Number(sp.get("limit") ?? 20),
    status:    sp.get("status")    ?? undefined,
    userId:    sp.get("userId")    ?? undefined,
    dateFrom:  sp.get("dateFrom")  ?? undefined,
    dateTo:    sp.get("dateTo")    ?? undefined,
    amountMin: sp.get("amountMin") ? Number(sp.get("amountMin")) : undefined,
    amountMax: sp.get("amountMax") ? Number(sp.get("amountMax")) : undefined,
    sortBy:    sp.get("sortBy")    ?? undefined,
    sortOrder: (sp.get("sortOrder") as "asc" | "desc") ?? "desc",
  }).catch((err) => {
    throw err
  })

  return NextResponse.json(result)
}
