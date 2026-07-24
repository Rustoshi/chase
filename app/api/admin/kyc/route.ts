import { NextRequest, NextResponse } from "next/server"
import { adminGuard }     from "@/lib/middleware/adminGuard"
import { getKycQueue }    from "@/lib/services/kyc.service"

export async function GET(req: NextRequest) {
  const { error } = await adminGuard()
  if (error) return error

  const p = req.nextUrl.searchParams
  try {
    const result = await getKycQueue({
      page:       Number(p.get("page")  ?? 1),
      limit:      Number(p.get("limit") ?? 20),
      status:     p.get("status")    ?? undefined,
      docType:    p.get("docType")   ?? undefined,
      dateFrom:   p.get("dateFrom")  ?? undefined,
      dateTo:     p.get("dateTo")    ?? undefined,
      sortBy:     p.get("sortBy")    ?? undefined,
      sortOrder:  p.get("sortOrder") ?? undefined,
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 })
  }
}
