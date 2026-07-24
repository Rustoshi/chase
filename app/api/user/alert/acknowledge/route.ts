import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { acknowledgeUserAlert } from "@/lib/services/alert.service"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await acknowledgeUserAlert(session.user.id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to acknowledge" }, { status: 500 })
  }
}
