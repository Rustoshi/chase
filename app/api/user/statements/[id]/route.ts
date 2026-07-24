import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getStatementById, getStatementData } from "@/lib/services/statement.service"
import { BANK_NAME } from "@/lib/brand"

// GET /api/user/statements/[id] - Get statement details or download
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const sp = req.nextUrl.searchParams
    const action = sp.get("action")

    // Download statement data (for PDF generation on client or server)
    if (action === "download") {
      const data = await getStatementData(session.user.id, id)
      if (!data) {
        return NextResponse.json({ error: "Statement not found" }, { status: 404 })
      }

      // Return data for PDF generation
      return NextResponse.json({
        bankName: BANK_NAME,
        statement: {
          referenceNumber: data.statement.referenceNumber,
          startDate: data.statement.startDate.toISOString(),
          endDate: data.statement.endDate.toISOString(),
          generatedAt: data.statement.generatedAt?.toISOString(),
          openingBalance: data.statement.openingBalance,
          closingBalance: data.statement.closingBalance,
          totalCredits: data.statement.totalCredits,
          totalDebits: data.statement.totalDebits,
          transactionCount: data.statement.transactionCount,
        },
        account: {
          accountNumber: data.account.accountNumber,
          accountType: data.account.accountType || "checking",
          currency: data.account.currency,
          routingNumber: data.account.routingNumber,
          swiftCode: data.account.swiftCode,
        },
        user: {
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          address: data.user.address,
        },
        transactions: data.transactions,
      })
    }

    // Get statement summary
    const statement = await getStatementById(session.user.id, id)
    if (!statement) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 })
    }

    return NextResponse.json({ statement })
  } catch (err) {
    console.error("[Statement API GET]", err)
    return NextResponse.json({ error: "Failed to load statement" }, { status: 500 })
  }
}
