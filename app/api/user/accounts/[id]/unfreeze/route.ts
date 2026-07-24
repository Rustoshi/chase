import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import Account from "@/lib/models/Account"
import Notification from "@/lib/models/Notification"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    const account = await Account.findById(id)
    if (!account || account.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    if (!account.isFrozen) {
      return NextResponse.json({ error: "Account is not frozen" }, { status: 400 })
    }

    account.isFrozen = false
    account.freezeReason = ""
    await account.save()

    await Notification.create({
      userId:  session.user.id,
      type:    "security",
      channel: "in_app",
      subject: "Account unfrozen",
      body:    `Your ${account.walletType} account ending in ${account.accountNumber.slice(-4)} has been unfrozen.`,
    })

    return NextResponse.json({ success: true, isFrozen: false })
  } catch (err) {
    console.error("[Unfreeze API]", err)
    return NextResponse.json({ error: "Failed to unfreeze account" }, { status: 500 })
  }
}
