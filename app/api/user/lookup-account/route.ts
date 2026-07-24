import { NextRequest, NextResponse } from "next/server"
import { auth }      from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import Account       from "@/lib/models/Account"
import User          from "@/lib/models/User"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const accountNumber = searchParams.get("accountNumber")?.trim()

    if (!accountNumber || accountNumber.length < 3) {
      return NextResponse.json({ error: "Account number required" }, { status: 400 })
    }

    await connectDB()

    const account = await Account.findOne({ accountNumber }).lean()
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Don't allow transferring to yourself
    if (String(account.userId) === session.user.id) {
      return NextResponse.json({ error: "Cannot transfer to your own account" }, { status: 400 })
    }

    if (account.isFrozen) {
      return NextResponse.json({ error: "Recipient account is unavailable" }, { status: 400 })
    }

    const user = await User.findById(account.userId).select("firstName lastName").lean()
    if (!user || !(user as Record<string, unknown>).firstName) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const u = user as Record<string, unknown>

    return NextResponse.json({
      accountNumber: account.accountNumber,
      walletType:    account.walletType,
      currency:      account.currency,
      recipientName: `${u.firstName} ${u.lastName}`,
    })
  } catch (err) {
    console.error("[GET /api/user/lookup-account]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
