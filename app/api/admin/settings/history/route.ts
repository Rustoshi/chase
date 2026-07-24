import { NextRequest, NextResponse } from "next/server"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { getSettingsHistory }       from "@/lib/services/settings.service"

export async function GET(req: NextRequest) {
  const { error } = await adminGuard()
  if (error) return error

  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 20)))
  const history = await getSettingsHistory(limit)
  return NextResponse.json(history)
}
