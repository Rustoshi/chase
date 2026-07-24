import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import TaxRefund from "@/lib/models/TaxRefund"
import Account from "@/lib/models/Account"
import Transaction from "@/lib/models/Transaction"

// ── GET — single tax refund detail ───────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()

    const refund = await TaxRefund.findOne({
      _id: id,
      userId: session.user.id,
    }).lean()
    if (!refund) return NextResponse.json({ error: "Refund not found" }, { status: 404 })

    const r = refund as Record<string, unknown>

    // Get deposit account info
    const account = await Account.findById(r.depositAccountId)
      .select("accountNumber accountType currency")
      .lean()

    // Get deposit transaction if deposited
    const depositTx = r.status === "deposited"
      ? await Transaction.findOne({
          userId: session.user.id,
          type: "tax_refund_deposit",
          "metadata.taxRefundId": String(r._id),
        }).lean()
      : null

    // Build timeline
    const timeline: Array<{ step: string; label: string; date: string | null; active: boolean; completed: boolean }> = []
    const statusOrder = ["pending", "under_review", "approved", "deposited"]
    const statusLabels: Record<string, string> = {
      pending:      "Filed",
      under_review: "Under Review",
      approved:     "Approved",
      deposited:    "Deposited",
    }

    if (r.status === "rejected") {
      timeline.push(
        { step: "pending", label: "Filed", date: (r.filingDate as Date)?.toISOString(), active: false, completed: true },
        { step: "under_review", label: "Under Review", date: null, active: false, completed: true },
        { step: "rejected", label: "Rejected", date: (r.reviewedAt as Date)?.toISOString() || null, active: true, completed: false },
      )
    } else {
      const currentIdx = statusOrder.indexOf(r.status as string)
      for (let i = 0; i < statusOrder.length; i++) {
        const s = statusOrder[i]
        let date: string | null = null
        if (s === "pending") date = (r.filingDate as Date)?.toISOString()
        if (s === "under_review" && i <= currentIdx) date = (r.reviewedAt as Date)?.toISOString() || null
        if (s === "approved" && i <= currentIdx) date = (r.reviewedAt as Date)?.toISOString() || null
        if (s === "deposited" && i <= currentIdx) date = (r.depositedAt as Date)?.toISOString() || null
        timeline.push({
          step: s,
          label: statusLabels[s],
          date,
          active: i === currentIdx,
          completed: i < currentIdx,
        })
      }
    }

    return NextResponse.json({
      refund: {
        _id:                  String(r._id),
        taxYear:              r.taxYear,
        filingType:           r.filingType,
        totalReportedIncome:  r.totalReportedIncome || 0,
        totalTaxWithheld:     r.totalTaxWithheld || 0,
        refundAmount:         r.refundAmount,
        ssnLast4:             r.ssnLast4,
        employer:             r.employer || null,
        status:               r.status,
        referenceNumber:      r.referenceNumber,
        documents:            r.documents || [],
        filingDate:           (r.filingDate as Date)?.toISOString(),
        estimatedDepositDate: (r.estimatedDepositDate as Date)?.toISOString() || null,
        actualDepositDate:    (r.actualDepositDate as Date)?.toISOString() || null,
        adminNote:            r.adminNote || null,
        rejectedReason:       r.rejectedReason || null,
        depositedAt:          (r.depositedAt as Date)?.toISOString() || null,
      },
      depositAccount: account
        ? {
            accountNumber: account.accountNumber,
            accountType:   account.accountType || "checking",
            currency:      account.currency,
          }
        : null,
      depositTransaction: depositTx
        ? {
            amount:    (depositTx.amount as number) / 100,
            reference: depositTx.reference,
            createdAt: (depositTx.createdAt as Date)?.toISOString(),
          }
        : null,
      timeline,
    })
  } catch (err) {
    console.error("[GET /api/user/tax-refunds/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
