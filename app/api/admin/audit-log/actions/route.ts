import { NextResponse }          from "next/server"
import { adminGuard }            from "@/lib/middleware/adminGuard"
import { getDistinctActions }    from "@/lib/services/auditLog.service"

export async function GET() {
  const { error } = await adminGuard()
  if (error) return error

  try {
    const actions = await getDistinctActions()
    return NextResponse.json(actions)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 })
  }
}
