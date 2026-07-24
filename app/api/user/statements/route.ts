import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  requestStatement,
  getUserStatements,
  getUserAccountsForStatement,
} from "@/lib/services/statement.service"

// GET /api/user/statements - List user's statements or get accounts
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sp = req.nextUrl.searchParams
    const action = sp.get("action")

    // Get accounts for statement request form
    if (action === "accounts") {
      const accounts = await getUserAccountsForStatement(session.user.id)
      return NextResponse.json({ accounts })
    }

    // List statements
    const data = await getUserStatements(session.user.id, {
      page: parseInt(sp.get("page") || "1", 10),
      limit: Math.min(parseInt(sp.get("limit") || "10", 10), 50),
      accountId: sp.get("accountId") || undefined,
    })

    return NextResponse.json(data)
  } catch (err) {
    console.error("[Statements API GET]", err)
    return NextResponse.json({ error: "Failed to load statements" }, { status: 500 })
  }
}

// POST /api/user/statements - Request a new statement
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { accountId, startDate, endDate, format, sendEmail } = body

    if (!accountId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Account ID, start date, and end date are required" },
        { status: 400 }
      )
    }

    const statement = await requestStatement({
      userId: session.user.id,
      accountId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      format: format || "pdf",
      sendEmail: sendEmail || false,
    })

    return NextResponse.json({
      success: true,
      statement: {
        _id: String(statement._id),
        referenceNumber: statement.referenceNumber,
        status: statement.status,
      },
    })
  } catch (err) {
    console.error("[Statements API POST]", err)
    const message = err instanceof Error ? err.message : "Failed to request statement"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
