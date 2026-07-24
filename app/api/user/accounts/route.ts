import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserAccounts } from "@/lib/services/dashboard-user.service"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accounts = await getUserAccounts(session.user.id)
    return NextResponse.json({ accounts })
  } catch (err) {
    console.error("[Accounts API]", err)
    return NextResponse.json({ error: "Failed to load accounts" }, { status: 500 })
  }
}
