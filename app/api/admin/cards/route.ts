import { NextRequest, NextResponse } from "next/server"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { getCardApplications }      from "@/lib/services/card.service"

export async function GET(req: NextRequest) {
  const { error } = await adminGuard()
  if (error) return error

  const sp = req.nextUrl.searchParams
  const result = await getCardApplications({
    page:      Number(sp.get("page")  ?? 1),
    limit:     Number(sp.get("limit") ?? 20),
    status:    sp.get("status")    ?? undefined,
    cardType:  sp.get("cardType")  ?? undefined,
    userId:    sp.get("userId")    ?? undefined,
    dateFrom:  sp.get("dateFrom")  ?? undefined,
    dateTo:    sp.get("dateTo")    ?? undefined,
    sortBy:    sp.get("sortBy")    ?? undefined,
    sortOrder: (sp.get("sortOrder") as "asc" | "desc") ?? "desc",
  })

  return NextResponse.json(result)
}
